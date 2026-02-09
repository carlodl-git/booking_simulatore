// Tipi condivisi per il sistema di prenotazioni

export type UserType = "socio" | "esterno"

export type BookingStatus = "confirmed" | "cancelled"

export type ActivityType = "9" | "18" | "pratica" | "mini-giochi" | "lezione-maestro"

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  userType: UserType
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: string
  customerId: string
  resourceId: string
  date: string // ISO date string (YYYY-MM-DD)
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  startsAt: string // ISO timestamp
  endsAt: string // ISO timestamp
  durationMinutes: number
  activityType: ActivityType
  players: number
  status: BookingStatus
  notes?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  // Snapshot fields from booking (used when customer data might have changed)
  customerFirstName?: string | null
  customerLastName?: string | null
}

export interface BlackoutPeriod {
  id: string
  resourceId: string
  startDate: string // ISO date string
  endDate: string // ISO date string
  startTime?: string // HH:mm format (optional, applies to all days in range)
  endTime?: string // HH:mm format (optional)
  reason?: string
}

export interface TimeSlot {
  time: string // HH:mm format
  available: boolean
}

export interface AvailabilityRequest {
  date: string // ISO date string
  durationMinutes: number
  resourceId?: string // default "trackman-io"
}

export interface AvailabilityResponse {
  date: string
  resourceId: string
  availableSlots: string[] // Array of HH:mm strings (considerando durationMinutes richiesto)
  occupiedSlots: string[] // Array di slot occupati (considerando durationMinutes richiesto)
  allOccupiedSlots: string[] // Array di tutti gli slot occupati (indipendentemente dalla durata)
}

export interface CreateBookingRequest {
  customer: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    userType: UserType
  }
  // Formato 1: date + startTime (legacy)
  date?: string // ISO date string (YYYY-MM-DD)
  startTime?: string // HH:mm format
  // Formato 2: startsAt (timestamp ISO completo)
  startsAt?: string // ISO timestamp (es. "2025-11-01T10:30:00.000+01:00")
  durationMinutes: number
  activityType: ActivityType
  players: number
  resourceId?: string // default "trackman-io"
  notes?: string
  adminNotes?: string
}

export interface CreateBookingResponse {
  booking: Booking
  customer: Customer
}

export interface BookingError {
  error: string
  code: string
  details?: unknown
}

export interface BookingWithCustomer extends Booking {
  customer: Customer
}

export interface MaestroPayment {
  id: string
  bookingId: string
  maestroName: string
  maestroEmail: string
  amount: number
  paid: boolean
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface MaestroSummary {
  maestroEmail: string
  maestroNames: string[] // Array di nomi per lo stesso maestro (stessa email)
  totalOwed: number
  totalPaid: number
  pendingAmount: number
  lessonsCount: number
  paidLessonsCount: number
}

