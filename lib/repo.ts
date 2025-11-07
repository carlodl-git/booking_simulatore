import { supabaseAdmin } from './supabase'
import { Booking, BookingWithCustomer, Customer } from './types'
import { DateTime } from 'luxon'

type CustomerRow = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  user_type: 'socio' | 'esterno'
  created_at: string
  updated_at: string
}

type BookingRow = {
  id: string
  customer_id: string
  resource_id: string
  starts_at: string
  ends_at: string
  duration_minutes: number
  activity_type: '9' | '18' | 'pratica' | 'mini-giochi'
  players: number
  status: 'confirmed' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}

type BookingWithCustomerRow = BookingRow & {
  customer: CustomerRow
}

type HttpError = Error & {
  code?: string
  httpStatus?: number
}

/**
 * Schema Supabase richiesto:
 * 
 * CREATE TABLE customers (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   first_name TEXT NOT NULL,
 *   last_name TEXT NOT NULL,
 *   email TEXT NOT NULL UNIQUE,
 *   phone TEXT,
 *   user_type TEXT NOT NULL CHECK (user_type IN ('socio', 'esterno')),
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE bookings (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   customer_id UUID NOT NULL REFERENCES customers(id),
 *   resource_id TEXT NOT NULL,
 *   starts_at TIMESTAMPTZ NOT NULL,
 *   ends_at TIMESTAMPTZ NOT NULL,
 *   duration_minutes INTEGER NOT NULL,
 *   activity_type TEXT NOT NULL CHECK (activity_type IN ('9', '18', 'pratica', 'mini-giochi')),
 *   players INTEGER NOT NULL CHECK (players >= 1 AND players <= 4),
 *   status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
 *   notes TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW(),
 *   CONSTRAINT no_overlaps_confirmed_bookings EXCLUDE USING gist (
 *     resource_id WITH =,
 *     tsrange(starts_at, ends_at) WITH &&
 *   ) WHERE (status = 'confirmed')
 * );
 * 
 * CREATE INDEX idx_bookings_resource_date ON bookings(resource_id, starts_at) WHERE status = 'confirmed';
 * CREATE INDEX idx_bookings_starts_at ON bookings(starts_at) WHERE status = 'confirmed';
 */

/**
 * Recupera le prenotazioni per una data specifica
 * Seleziona solo quelle con status != 'cancelled'
 */
export async function getBookingsForDate(
  resourceId: string,
  dateISO: string
): Promise<Booking[]> {
  // Calcola inizio e fine del giorno in UTC
  const dateStart = new Date(dateISO)
  dateStart.setHours(0, 0, 0, 0)
  
  const dateEnd = new Date(dateISO)
  dateEnd.setHours(23, 59, 59, 999)

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      customer_id,
      resource_id,
      starts_at,
      ends_at,
      duration_minutes,
      activity_type,
      players,
      status,
      notes,
      created_at,
      updated_at
    `)
    .eq('resource_id', resourceId)
    .eq('status', 'confirmed')
    .gte('starts_at', dateStart.toISOString())
    .lte('starts_at', dateEnd.toISOString())
    .order('starts_at', { ascending: true })

  if (error) {
    console.error('Errore nel recupero bookings:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  // Mappa i dati da Supabase al formato Booking
  const rows = (data ?? []) as BookingRow[]
  return rows.map(mapBookingFromDB)
}

/**
 * Upsert di un customer basato su email
 */
export async function upsertCustomer({
  firstName,
  lastName,
  email,
  phone,
  userType,
}: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  userType: 'socio' | 'esterno'
}): Promise<Customer> {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .upsert(
      {
        email: email.toLowerCase().trim(),
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        user_type: userType,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'email',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single()

  if (error) {
    console.error('Errore nell upsert customer:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  return mapCustomerFromDB(data as CustomerRow)
}

/**
 * Crea una prenotazione in una transazione atomica
 * Si affida al constraint EXCLUDE per prevenire overlap
 * Gestisce errori SQL 23P01 (exclusion_violation) e 23505 (unique_violation) → 409
 */
export async function createBookingTx({
  resourceId,
  customerId,
  startsAt,
  endsAt,
  durationMinutes,
  activityType,
  players,
  notes,
}: {
  resourceId: string
  customerId: string
  startsAt: string // ISO timestamp
  endsAt: string // ISO timestamp
  durationMinutes: number
  activityType: '9' | '18' | 'pratica' | 'mini-giochi'
  players: number
  notes?: string
}): Promise<Booking> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      customer_id: customerId,
      resource_id: resourceId,
      starts_at: startsAt,
      ends_at: endsAt,
      duration_minutes: durationMinutes,
      activity_type: activityType,
      players: players,
      status: 'confirmed',
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    // Mappa errori SQL a HTTP
    if (error.code === '23P01' || error.code === '23505') {
      const overlapError: HttpError = new Error('La prenotazione si sovrappone con una prenotazione esistente')
      overlapError.code = 'OVERLAP'
      overlapError.httpStatus = 409
      throw overlapError
    }

    console.error('Errore nella creazione booking:', error)
    const dbError: HttpError = new Error(`Errore database: ${error.message}`)
    dbError.code = 'DB_ERROR'
    dbError.httpStatus = 500
    throw dbError
  }

  return mapBookingFromDB(data as BookingRow)
}

/**
 * Aggiorna lo status di una prenotazione a 'cancelled'
 */
export async function cancelBooking(bookingId: string): Promise<Booking> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      const notFoundError: HttpError = new Error('Prenotazione non trovata')
      notFoundError.code = 'NOT_FOUND'
      notFoundError.httpStatus = 404
      throw notFoundError
    }

    console.error('Errore nella cancellazione booking:', error)
    const dbError: HttpError = new Error(`Errore database: ${error.message}`)
    dbError.code = 'DB_ERROR'
    dbError.httpStatus = 500
    throw dbError
  }

  return mapBookingFromDB(data as BookingRow)
}

/**
 * Recupera tutte le prenotazioni con i dati del cliente
 */
export async function getAllBookings(limit: number = 1000): Promise<BookingWithCustomer[]> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      customer:customers(*)
    `)
    .order('starts_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Errore nel recupero bookings:', error)
    const dbError: HttpError = new Error(`Errore database: ${error.message}`)
    dbError.code = 'DB_ERROR'
    dbError.httpStatus = 500
    throw dbError
  }

  const rows = (data ?? []) as BookingWithCustomerRow[]
  return rows.map(row => ({
    ...mapBookingFromDB(row),
    customer: mapCustomerFromDB(row.customer),
  }))
}

/**
 * Helper: Mappa i dati dal database al tipo Customer
 */
function mapCustomerFromDB(row: CustomerRow): Customer {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone || undefined,
    userType: row.user_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Helper: Mappa i dati dal database al tipo Booking
 */
function mapBookingFromDB(row: BookingRow): Booking {
  // Estrai date e orari da starts_at e ends_at convertendoli in Europe/Rome
  const startsAt = DateTime.fromISO(row.starts_at).setZone('Europe/Rome')
  const endsAt = DateTime.fromISO(row.ends_at).setZone('Europe/Rome')
  
  // Formatta come ISO date (YYYY-MM-DD) usando il timezone Europe/Rome
  const date = startsAt.toISODate()!
  
  // Formatta orari come HH:mm in Europe/Rome
  const startTime = startsAt.toFormat('HH:mm')
  const endTime = endsAt.toFormat('HH:mm')

  return {
    id: row.id,
    customerId: row.customer_id,
    resourceId: row.resource_id,
    date,
    startTime,
    endTime,
    startsAt: startsAt.toISO()!,
    endsAt: endsAt.toISO()!,
    durationMinutes: row.duration_minutes,
    activityType: row.activity_type,
    players: row.players,
    status: row.status,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
