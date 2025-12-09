import { Booking, BlackoutPeriod } from "./types"
import { DateTime } from "luxon"

// Orari di apertura del simulatore (Europe/Rome timezone)
export const OPENING_TIME = "09:30"
export const CLOSING_TIME = "23:00"
export const BUFFER_MINUTES = 10 // Buffer tra prenotazioni
export const TIMEZONE = "Europe/Rome"

// Genera tutti gli slot disponibili in un giorno (ogni 30 minuti)
export function generateTimeSlots(
  startTime: string = OPENING_TIME,
  endTime: string = CLOSING_TIME
): string[] {
  const slots: string[] = []
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  let currentHour = startHour
  let currentMinute = startMinute

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute <= endMinute)
  ) {
    slots.push(
      `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`
    )

    currentMinute += 30
    if (currentMinute >= 60) {
      currentMinute = 0
      currentHour += 1
    }
  }

  return slots
}

// Calcola l'orario finale aggiungendo i minuti
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes

  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60

  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`
}

// Genera tutti gli slot tra startTime e endTime (ogni 30 minuti)
export function generateTimeSlotsBetween(startTime: string, endTime: string): string[] {
  const slots: string[] = []
  const [startHours, startMinutes] = startTime.split(":").map(Number)
  const [endHours, endMinutes] = endTime.split(":").map(Number)

  let currentHours = startHours
  let currentMinutes = startMinutes

  while (
    currentHours < endHours ||
    (currentHours === endHours && currentMinutes < endMinutes)
  ) {
    slots.push(
      `${currentHours.toString().padStart(2, "0")}:${currentMinutes.toString().padStart(2, "0")}`
    )

    currentMinutes += 30
    if (currentMinutes >= 60) {
      currentMinutes = 0
      currentHours += 1
    }
  }

  return slots
}

// Verifica se un booking è attivo (non cancellato) per una data
export function isBookingActive(booking: Booking, date: string): boolean {
  return (
    booking.status === "confirmed" &&
    booking.date === date
  )
}

// Verifica se due intervalli temporali si sovrappongono
// NOTA: Buffer non applicato - due prenotazioni possono adiacere perfettamente
export function hasTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const [h1, m1] = start1.split(":").map(Number)
  const [h2, m2] = end1.split(":").map(Number)
  const [h3, m3] = start2.split(":").map(Number)
  const [h4, m4] = end2.split(":").map(Number)

  const start1Minutes = h1 * 60 + m1
  const end1Minutes = h2 * 60 + m2
  const start2Minutes = h3 * 60 + m3
  const end2Minutes = h4 * 60 + m4

  return !(end1Minutes <= start2Minutes || end2Minutes <= start1Minutes)
}

// Verifica se uno slot è occupato considerando i bookings esistenti
export function isSlotOccupied(
  slotTime: string,
  durationMinutes: number,
  bookings: Booking[],
  date: string,
  resourceId: string
): boolean {
  const slotEndTime = calculateEndTime(slotTime, durationMinutes)

  return bookings.some((booking) => {
    if (
      !isBookingActive(booking, date) ||
      booking.resourceId !== resourceId
    ) {
      return false
    }

    return hasTimeOverlap(
      slotTime,
      slotEndTime,
      booking.startTime,
      booking.endTime
    )
  })
}

// Verifica se uno slot è in un periodo di blackout
export function isSlotInBlackout(
  slotTime: string,
  durationMinutes: number,
  date: string,
  blackouts: BlackoutPeriod[],
  resourceId: string
): boolean {
  const slotEndTime = calculateEndTime(slotTime, durationMinutes)
  const slotDate = DateTime.fromISO(date, { zone: TIMEZONE })

  return blackouts.some((blackout) => {
    if (blackout.resourceId !== resourceId) {
      return false
    }

    const blackoutStart = DateTime.fromISO(blackout.startDate, { zone: TIMEZONE })
    const blackoutEnd = DateTime.fromISO(blackout.endDate, { zone: TIMEZONE })

    // Verifica se la data è nel range del blackout
    if (slotDate < blackoutStart || slotDate > blackoutEnd) {
      return false
    }

    // Se il blackout ha orari specifici, verifica anche quelli
    if (blackout.startTime && blackout.endTime) {
      return hasTimeOverlap(
        slotTime,
        slotEndTime,
        blackout.startTime,
        blackout.endTime
      )
    }

    // Se non ha orari specifici, tutto il giorno è in blackout
    return true
  })
}

// Calcola tutti gli slot occupati per una data (indipendentemente dalla durata richiesta)
// Include sia bookings che blackout
export function calculateAllOccupiedSlots(
  date: string,
  bookings: Booking[],
  resourceId: string = "trackman-io",
  blackouts: BlackoutPeriod[] = []
): string[] {
  const occupiedSlots: string[] = []
  
  // Aggiungi slot occupati dai bookings
  bookings.forEach((booking) => {
    if (!isBookingActive(booking, date) || booking.resourceId !== resourceId) {
      return
    }
    
    // Genera tutti gli slot da startTime a endTime
    const slots = generateTimeSlotsBetween(booking.startTime, booking.endTime)
    occupiedSlots.push(...slots)
  })
  
  // Aggiungi slot occupati dai blackout
  const slotDate = DateTime.fromISO(date, { zone: TIMEZONE })
  const slotDateISO = slotDate.toISODate() // YYYY-MM-DD
  
  console.log('[calculateAllOccupiedSlots] Verifica blackout per data:', slotDateISO, 'blackouts:', blackouts.length)
  
  blackouts.forEach((blackout) => {
    if (blackout.resourceId !== resourceId) {
      console.log('[calculateAllOccupiedSlots] Blackout saltato - resourceId diverso:', blackout.resourceId, 'vs', resourceId)
      return
    }
    
    // Verifica se la data è nel range del blackout (confronto solo le date)
    if (slotDateISO < blackout.startDate || slotDateISO > blackout.endDate) {
      console.log('[calculateAllOccupiedSlots] Blackout saltato - data fuori range:', slotDateISO, 'vs', blackout.startDate, '-', blackout.endDate)
      return
    }
    
    console.log('[calculateAllOccupiedSlots] Blackout applicato:', {
      startDate: blackout.startDate,
      endDate: blackout.endDate,
      startTime: blackout.startTime,
      endTime: blackout.endTime,
      reason: blackout.reason,
    })
    
    // Se il blackout ha orari specifici, genera solo quegli slot
    if (blackout.startTime && blackout.endTime) {
      const slots = generateTimeSlotsBetween(blackout.startTime, blackout.endTime)
      console.log('[calculateAllOccupiedSlots] Slot blackout generati (con orari):', slots.length, slots)
      occupiedSlots.push(...slots)
    } else {
      // Se non ha orari specifici, tutto il giorno è in blackout
      // Genera tutti gli slot del giorno
      const allDaySlots = generateTimeSlots()
      console.log('[calculateAllOccupiedSlots] Slot blackout generati (tutto il giorno):', allDaySlots.length)
      occupiedSlots.push(...allDaySlots)
    }
  })
  
  // Rimuovi duplicati
  return Array.from(new Set(occupiedSlots))
}

// Calcola gli slot disponibili per una data (usa Europe/Rome timezone)
export function calculateAvailableSlots(
  date: string,
  durationMinutes: number,
  bookings: Booking[],
  blackouts: BlackoutPeriod[],
  resourceId: string = "trackman-io"
): {
  availableSlots: string[]
  occupiedSlots: string[]
} {
  // Usa Europe/Rome timezone per gestire correttamente i day boundaries
  const dateObj = DateTime.fromISO(date, { zone: TIMEZONE })
  const dateISO = dateObj.toISODate() // YYYY-MM-DD format
  
  const allSlots = generateTimeSlots()
  const availableSlots: string[] = []
  const occupiedSlots: string[] = []

  for (const slot of allSlots) {
    const slotEndTime = calculateEndTime(slot, durationMinutes)

    // Verifica se lo slot va oltre l'orario di chiusura
    if (slotEndTime > CLOSING_TIME) {
      continue
    }

    const isOccupied =
      isSlotOccupied(slot, durationMinutes, bookings, dateISO!, resourceId) ||
      isSlotInBlackout(slot, durationMinutes, dateISO!, blackouts, resourceId)

    if (isOccupied) {
      occupiedSlots.push(slot)
    } else {
      availableSlots.push(slot)
    }
  }

  return { availableSlots, occupiedSlots }
}
