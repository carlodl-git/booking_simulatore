import { supabaseAdmin } from './supabase'
import { Booking, BookingWithCustomer, Customer, BlackoutPeriod, MaestroPayment, MaestroSummary } from './types'
import { DateTime } from 'luxon'

// Helper per logging solo in sviluppo
const isDevelopment = process.env.NODE_ENV === 'development'
const debugLog = (...args: unknown[]) => {
  if (isDevelopment) {
    console.log(...args)
  }
}

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
  activity_type: '9' | '18' | 'pratica' | 'mini-giochi' | 'lezione-maestro'
  players: number
  status: 'confirmed' | 'cancelled'
  notes: string | null
  customer_first_name: string | null
  customer_last_name: string | null
  customer_phone: string | null
  customer_user_type: 'socio' | 'esterno' | null
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
 *   activity_type TEXT NOT NULL CHECK (activity_type IN ('9', '18', 'pratica', 'mini-giochi', 'lezione-maestro')),
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
  // Usa Luxon per gestire correttamente il timezone Europe/Rome
  // La data viene passata come YYYY-MM-DD, la interpretiamo come data locale in Europe/Rome
  const dateObj = DateTime.fromISO(dateISO, { zone: 'Europe/Rome' })
  
  // Calcola inizio e fine del giorno in Europe/Rome
  const dateStart = dateObj.startOf('day').toUTC()
  const dateEnd = dateObj.endOf('day').toUTC()

  debugLog('[getBookingsForDate] Ricerca bookings per:', {
    resourceId,
    dateISO,
    dateStart: dateStart.toISO(),
    dateEnd: dateEnd.toISO(),
  })

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
    .gte('starts_at', dateStart.toISO()!)
    .lte('starts_at', dateEnd.toISO()!)
    .order('starts_at', { ascending: true })

  if (error) {
    console.error('Errore nel recupero bookings:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  debugLog('[getBookingsForDate] Bookings trovati:', (data ?? []).length)

  // Mappa i dati da Supabase al formato Booking
  const rows = (data ?? []) as BookingRow[]
  const bookings = rows.map(mapBookingFromDB)
  
  return bookings
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
  customerFirstName,
  customerLastName,
  customerPhone,
  customerUserType,
}: {
  resourceId: string
  customerId: string
  startsAt: string // ISO timestamp
  endsAt: string // ISO timestamp
  durationMinutes: number
  activityType: '9' | '18' | 'pratica' | 'mini-giochi' | 'lezione-maestro'
  players: number
  notes?: string
  customerFirstName?: string
  customerLastName?: string
  customerPhone?: string
  customerUserType?: 'socio' | 'esterno'
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
      customer_first_name: customerFirstName || null,
      customer_last_name: customerLastName || null,
      customer_phone: customerPhone || null,
      customer_user_type: customerUserType || null,
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
  return rows.map(row => {
    const booking = mapBookingFromDB(row)
    const customer = mapCustomerFromDB(row.customer)
    applySnapshotToCustomer(row, customer)
    return {
      ...booking,
      customer,
    }
  })
}

/**
 * Applica eventuali snapshot del customer registrati nella prenotazione
 */
function applySnapshotToCustomer(row: BookingWithCustomerRow, customer: Customer) {
  if (row.customer_first_name) {
    customer.firstName = row.customer_first_name
  }

  if (row.customer_last_name) {
    customer.lastName = row.customer_last_name
  }

  if (row.customer_phone) {
    customer.phone = row.customer_phone
  }

  if (row.customer_user_type) {
    customer.userType = row.customer_user_type
  }
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

// ==================== BLACKOUTS ====================

type BlackoutRow = {
  id: string
  resource_id: string
  start_date: string // DATE format YYYY-MM-DD
  end_date: string   // DATE format YYYY-MM-DD
  start_time: string | null // TIME format HH:mm:ss or NULL
  end_time: string | null   // TIME format HH:mm:ss or NULL
  reason: string | null
  created_at: string
  updated_at: string
}

/**
 * Recupera i blackout per un range di date
 */
export async function getBlackoutsForDateRange(
  resourceId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
): Promise<BlackoutPeriod[]> {
  // Recupera blackout che si sovrappongono con il range richiesto
  // Un blackout si sovrappone se: start_date <= endDate AND end_date >= startDate
  const { data, error } = await supabaseAdmin
    .from('blackouts')
    .select('*')
    .eq('resource_id', resourceId)
    .lte('start_date', endDate)
    .gte('end_date', startDate)
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Errore nel recupero blackouts:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  const rows = (data ?? []) as BlackoutRow[]
  return rows.map(mapBlackoutFromDB)
}

/**
 * Recupera tutti i blackout
 */
export async function getAllBlackouts(resourceId?: string): Promise<BlackoutPeriod[]> {
  let query = supabaseAdmin
    .from('blackouts')
    .select('*')
    .order('start_date', { ascending: true })

  if (resourceId) {
    query = query.eq('resource_id', resourceId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Errore nel recupero blackouts:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  const rows = (data ?? []) as BlackoutRow[]
  return rows.map(mapBlackoutFromDB)
}

/**
 * Crea un nuovo blackout
 */
export async function createBlackout(blackout: {
  resourceId: string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  startTime?: string // HH:mm (optional)
  endTime?: string   // HH:mm (optional)
  reason?: string
}): Promise<BlackoutPeriod> {
  const { data, error } = await supabaseAdmin
    .from('blackouts')
    .insert({
      resource_id: blackout.resourceId,
      start_date: blackout.startDate,
      end_date: blackout.endDate,
      start_time: blackout.startTime || null,
      end_time: blackout.endTime || null,
      reason: blackout.reason || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Errore nella creazione blackout:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  return mapBlackoutFromDB(data as BlackoutRow)
}

/**
 * Aggiorna un blackout esistente
 */
export async function updateBlackout(
  blackoutId: string,
  updates: {
    startDate?: string
    endDate?: string
    startTime?: string | null
    endTime?: string | null
    reason?: string | null
  }
): Promise<BlackoutPeriod> {
  const updateData: Partial<BlackoutRow> = {}
  
  if (updates.startDate) updateData.start_date = updates.startDate
  if (updates.endDate) updateData.end_date = updates.endDate
  if (updates.startTime !== undefined) updateData.start_time = updates.startTime
  if (updates.endTime !== undefined) updateData.end_time = updates.endTime
  if (updates.reason !== undefined) updateData.reason = updates.reason

  const { data, error } = await supabaseAdmin
    .from('blackouts')
    .update(updateData)
    .eq('id', blackoutId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Blackout non trovato')
    }
    console.error('Errore nell\'aggiornamento blackout:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  return mapBlackoutFromDB(data as BlackoutRow)
}

/**
 * Elimina un blackout
 */
export async function deleteBlackout(blackoutId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('blackouts')
    .delete()
    .eq('id', blackoutId)

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Blackout non trovato')
    }
    console.error('Errore nell\'eliminazione blackout:', error)
    throw new Error(`Errore database: ${error.message}`)
  }
}

/**
 * Helper: Mappa i dati dal database al tipo BlackoutPeriod
 */
function mapBlackoutFromDB(row: BlackoutRow): BlackoutPeriod {
  return {
    id: row.id,
    resourceId: row.resource_id,
    startDate: row.start_date,
    endDate: row.end_date,
    startTime: row.start_time ? row.start_time.substring(0, 5) : undefined, // Converti HH:mm:ss in HH:mm
    endTime: row.end_time ? row.end_time.substring(0, 5) : undefined,
    reason: row.reason || undefined,
  }
}

/**
 * Tipo per i dati dal database per maestro_payments
 */
type MaestroPaymentRow = {
  id: string
  booking_id: string
  maestro_name: string
  maestro_email: string
  amount: number
  paid: boolean
  paid_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Recupera tutte le prenotazioni "lezione-maestro" passate e non cancellate
 * e crea/aggiorna i record di pagamento se non esistono
 */
export async function syncMaestroPayments(): Promise<void> {
  const today = DateTime.now().setZone("Europe/Rome").startOf("day")
  
  // Recupera tutte le prenotazioni lezione-maestro passate e non cancellate con i dati del customer
  const { data: bookings, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      customer_first_name,
      customer_last_name,
      starts_at,
      customer_id
    `)
    .eq('activity_type', 'lezione-maestro')
    .eq('status', 'confirmed')
    .lt('starts_at', today.toISO()!)
    .order('starts_at', { ascending: false })

  if (bookingsError) {
    console.error('Errore nel recupero prenotazioni maestri:', bookingsError)
    throw new Error(`Errore database: ${bookingsError.message}`)
  }

  if (!bookings || bookings.length === 0) {
    return
  }

  // Recupera tutti i customers in una singola query per evitare N+1
  const customerIds = [...new Set(bookings.map(b => b.customer_id).filter(Boolean))]
  const { data: customers, error: customersError } = await supabaseAdmin
    .from('customers')
    .select('id, email')
    .in('id', customerIds)

  if (customersError) {
    console.error('Errore nel recupero customers:', customersError)
    throw new Error(`Errore database: ${customersError.message}`)
  }

  // Crea una mappa per accesso rapido alle email
  const customerEmailMap = new Map<string, string>()
  if (customers) {
    for (const customer of customers) {
      customerEmailMap.set(customer.id, customer.email.toLowerCase().trim())
    }
  }

  // Recupera tutti i pagamenti esistenti in una singola query
  const bookingIds = bookings.map(b => b.id)
  const { data: existingPayments } = await supabaseAdmin
    .from('maestro_payments')
    .select('booking_id')
    .in('booking_id', bookingIds)

  const existingPaymentBookingIds = new Set(
    existingPayments?.map((p: { booking_id: string }) => p.booking_id) || []
  )

  // Prepara i pagamenti da creare in batch
  const paymentsToInsert: Array<{
    booking_id: string
    maestro_name: string
    maestro_email: string
    amount: number
    paid: boolean
  }> = []

  for (const booking of bookings) {
    // Salta se esiste già un pagamento
    if (existingPaymentBookingIds.has(booking.id)) {
      continue
    }

    const maestroName = `${booking.customer_first_name || ''} ${booking.customer_last_name || ''}`.trim()
    
    if (!maestroName) {
      console.warn(`Prenotazione ${booking.id} senza nome maestro`)
      continue
    }

    // Recupera l'email del customer dalla mappa
    const maestroEmail = customerEmailMap.get(booking.customer_id)
    if (!maestroEmail) {
      console.warn(`Prenotazione ${booking.id} senza customer valido`)
      continue
    }

    paymentsToInsert.push({
      booking_id: booking.id,
      maestro_name: maestroName,
      maestro_email: maestroEmail,
      amount: 10.00,
      paid: false,
    })
  }

  // Inserisci tutti i pagamenti in una singola query batch
  if (paymentsToInsert.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('maestro_payments')
      .insert(paymentsToInsert)

    if (insertError) {
      console.error('Errore nella creazione batch pagamenti:', insertError)
      throw new Error(`Errore database: ${insertError.message}`)
    }
  }
}

/**
 * Recupera il riepilogo dei pagamenti per tutti i maestri
 * Raggruppa per email (stesso maestro anche con nomi diversi)
 */
export async function getMaestroSummaries(): Promise<MaestroSummary[]> {
  // Prima sincronizza i pagamenti
  await syncMaestroPayments()

  // Recupera tutti i pagamenti
  const { data: payments, error } = await supabaseAdmin
    .from('maestro_payments')
    .select('*')
    .order('maestro_email', { ascending: true })

  if (error) {
    console.error('Errore nel recupero pagamenti maestri:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  if (!payments || payments.length === 0) {
    return []
  }

  // Raggruppa per email (stesso maestro anche con nomi diversi)
  const summariesMap = new Map<string, MaestroSummary>()

  for (const payment of payments as MaestroPaymentRow[]) {
    const maestroEmail = payment.maestro_email.toLowerCase().trim()
    const maestroName = payment.maestro_name.trim()
    
    if (!summariesMap.has(maestroEmail)) {
      summariesMap.set(maestroEmail, {
        maestroEmail,
        maestroNames: [],
        totalOwed: 0,
        totalPaid: 0,
        pendingAmount: 0,
        lessonsCount: 0,
        paidLessonsCount: 0,
      })
    }

    const summary = summariesMap.get(maestroEmail)!
    
    // Aggiungi il nome se non è già presente
    if (!summary.maestroNames.includes(maestroName)) {
      summary.maestroNames.push(maestroName)
    }
    
    summary.lessonsCount++
    summary.totalOwed += payment.amount

    if (payment.paid) {
      summary.paidLessonsCount++
      summary.totalPaid += payment.amount
    } else {
      summary.pendingAmount += payment.amount
    }
  }

  // Ordina i nomi per ogni summary
  summariesMap.forEach((summary) => {
    summary.maestroNames.sort()
  })

  return Array.from(summariesMap.values())
}

/**
 * Recupera tutti i pagamenti per un maestro specifico (identificato per email)
 */
export async function getMaestroPayments(maestroEmail: string): Promise<(MaestroPayment & { booking: BookingWithCustomer })[]> {
  await syncMaestroPayments()

  const { data: payments, error } = await supabaseAdmin
    .from('maestro_payments')
    .select('*')
    .eq('maestro_email', maestroEmail.toLowerCase().trim())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore nel recupero pagamenti maestro:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  if (!payments || payments.length === 0) {
    return []
  }

  // Recupera le prenotazioni associate
  const bookingIds = payments.map((p: MaestroPaymentRow) => p.booking_id)
  const { data: bookingsData, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      customer:customers(*)
    `)
    .in('id', bookingIds)

  if (bookingsError) {
    console.error('Errore nel recupero prenotazioni:', bookingsError)
    throw new Error(`Errore database: ${bookingsError.message}`)
  }

  const bookingsMap = new Map<string, BookingWithCustomer>()
  if (bookingsData) {
    for (const row of bookingsData as BookingWithCustomerRow[]) {
      const booking = mapBookingFromDB(row)
      const customer = mapCustomerFromDB(row.customer)
      applySnapshotToCustomer(row, customer)
      bookingsMap.set(booking.id, {
        ...booking,
        customer,
      })
    }
  }

  // Combina pagamenti e prenotazioni
  return payments.map((payment: MaestroPaymentRow) => {
    const booking = bookingsMap.get(payment.booking_id)
    if (!booking) {
      throw new Error(`Prenotazione ${payment.booking_id} non trovata`)
    }
    return {
      ...mapMaestroPaymentFromDB(payment),
      booking,
    }
  })
}

/**
 * Segna un pagamento come saldato
 */
export async function markMaestroPaymentAsPaid(paymentId: string): Promise<MaestroPayment> {
  const { data, error } = await supabaseAdmin
    .from('maestro_payments')
    .update({
      paid: true,
      paid_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Pagamento non trovato')
    }
    console.error('Errore nell\'aggiornamento pagamento:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  return mapMaestroPaymentFromDB(data as MaestroPaymentRow)
}

/**
 * Segna un pagamento come non saldato (annulla il pagamento)
 */
export async function markMaestroPaymentAsUnpaid(paymentId: string): Promise<MaestroPayment> {
  const { data, error } = await supabaseAdmin
    .from('maestro_payments')
    .update({
      paid: false,
      paid_at: null,
    })
    .eq('id', paymentId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Pagamento non trovato')
    }
    console.error('Errore nell\'aggiornamento pagamento:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  return mapMaestroPaymentFromDB(data as MaestroPaymentRow)
}

/**
 * Helper: Mappa i dati dal database al tipo MaestroPayment
 */
function mapMaestroPaymentFromDB(row: MaestroPaymentRow): MaestroPayment {
  return {
    id: row.id,
    bookingId: row.booking_id,
    maestroName: row.maestro_name,
    maestroEmail: row.maestro_email,
    amount: row.amount,
    paid: row.paid,
    paidAt: row.paid_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Calcola il totale dovuto da tutti i maestri
 */
export async function getTotalMaestroOwed(): Promise<number> {
  await syncMaestroPayments()

  const { data, error } = await supabaseAdmin
    .from('maestro_payments')
    .select('amount, paid')
  
  if (error) {
    console.error('Errore nel calcolo totale dovuto:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return 0
  }

  return data
    .filter((p: { paid: boolean }) => !p.paid)
    .reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
}

/**
 * Calcola il totale incassato dai maestri (pagamenti saldati)
 * Con filtri opzionali per periodo (data del pagamento)
 */
export async function getTotalMaestroPaid(
  startDate?: string, // YYYY-MM-DD
  endDate?: string    // YYYY-MM-DD
): Promise<number> {
  await syncMaestroPayments()

  let query = supabaseAdmin
    .from('maestro_payments')
    .select('amount, paid_at')
    .eq('paid', true)

  // Applica filtri per periodo se forniti
  if (startDate) {
    const startDateTime = DateTime.fromISO(startDate, { zone: 'Europe/Rome' })
      .startOf('day')
      .toUTC()
      .toISO()
    query = query.gte('paid_at', startDateTime!)
  }

  if (endDate) {
    const endDateTime = DateTime.fromISO(endDate, { zone: 'Europe/Rome' })
      .endOf('day')
      .toUTC()
      .toISO()
    query = query.lte('paid_at', endDateTime!)
  }

  const { data, error } = await query

  if (error) {
    console.error('Errore nel calcolo totale incassato:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return 0
  }

  return data.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
}

/**
 * Calcola il totale incassato da tutte le prenotazioni passate non cancellate
 * - 20€ l'ora per tutte le attività tranne "lezione-maestro"
 * - 10€ l'ora per "lezione-maestro"
 * 
 * Ottimizzato: usa SQL aggregation invece di caricare tutti i dati in memoria
 */
export async function getTotalRevenueFromPastBookings(): Promise<number> {
  const today = DateTime.now().setZone("Europe/Rome").startOf("day").toUTC()

  // Usa SQL aggregation per calcolare il revenue direttamente nel database
  // Questo è molto più efficiente che caricare tutti i dati e calcolare in JavaScript
  const { data, error } = await supabaseAdmin.rpc('calculate_total_revenue', {
    before_date: today.toISO()!
  }).single()

  // Se la funzione RPC non esiste, fallback al metodo precedente
  if (error && error.code === '42883') {
    // Funzione RPC non esiste, usa il metodo precedente come fallback
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('duration_minutes, activity_type')
      .eq('status', 'confirmed')
      .lt('starts_at', today.toISO()!)

    if (bookingsError) {
      console.error('Errore nel calcolo totale incassato:', bookingsError)
      throw new Error(`Errore database: ${bookingsError.message}`)
    }

    if (!bookings || bookings.length === 0) {
      return 0
    }

    let total = 0
    for (const booking of bookings) {
      const hours = booking.duration_minutes / 60
      const isMaestroLesson = booking.activity_type === 'lezione-maestro'
      const pricePerHour = isMaestroLesson ? 10 : 20
      total += hours * pricePerHour
    }
    return total
  }

  if (error) {
    console.error('Errore nel calcolo totale incassato:', error)
    throw new Error(`Errore database: ${error.message}`)
  }

  return data?.total_revenue || 0
}
