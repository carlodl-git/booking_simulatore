/**
 * Test per il POST booking e controllo overlap
 * Ora usa mock di Supabase/repo invece di storage JSON
 */
import { NextRequest } from "next/server"
import { POST } from "@/app/api/bookings/route"
import { Booking, Customer } from "@/lib/types"

// Mock del repository Supabase
jest.mock("@/lib/repo", () => {
  let mockCustomers: Customer[] = []
  let mockBookings: Booking[] = []
  let customerIdCounter = 1
  let bookingIdCounter = 1

  const resetMocks = () => {
    mockCustomers = []
    mockBookings = []
    customerIdCounter = 1
    bookingIdCounter = 1
  }

  return {
    __resetMocks: resetMocks,
    upsertCustomer: jest.fn(async (data: any) => {
      const existing = mockCustomers.find(c => c.email.toLowerCase() === data.email.toLowerCase())
      if (existing) {
        // Update
        Object.assign(existing, {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || existing.phone,
          userType: data.userType,
          updatedAt: new Date().toISOString(),
        })
        return existing
      }
      // Create
      const customer: Customer = {
        id: `customer-${customerIdCounter++}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        userType: data.userType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockCustomers.push(customer)
      return customer
    }),
    createBookingTx: jest.fn(async (data: any) => {
      // Simula controllo overlap
      const conflicting = mockBookings.find(b => {
        if (b.status !== 'confirmed' || b.resourceId !== data.resourceId) {
          return false
        }
        
        // Controlla sovrapposizione usando timestamp ISO
        // Il formato di b è date (YYYY-MM-DD) + startTime (HH:mm), mentre data è ISO timestamp
        const existingStart = new Date(`${b.date}T${b.startTime}:00Z`).getTime()
        const existingEnd = new Date(`${b.date}T${b.endTime}:00Z`).getTime()
        const newStart = new Date(data.startsAt).getTime()
        const newEnd = new Date(data.endsAt).getTime()
        
        // Si sovrappongono se non sono completamente separati
        return !(newEnd <= existingStart || newStart >= existingEnd)
      })

      if (conflicting) {
        const error = new Error('La prenotazione si sovrappone con una prenotazione esistente')
        ;(error as any).code = 'OVERLAP'
        ;(error as any).httpStatus = 409
        throw error
      }

      // Estrai date e time da timestamp ISO UTC
      const startsAtDate = new Date(data.startsAt)
      const endsAtDate = new Date(data.endsAt)
      
      const booking: Booking = {
        id: `booking-${bookingIdCounter++}`,
        customerId: data.customerId,
        resourceId: data.resourceId,
        date: startsAtDate.toISOString().split('T')[0],
        startTime: `${startsAtDate.getUTCHours().toString().padStart(2, '0')}:${startsAtDate.getUTCMinutes().toString().padStart(2, '0')}`,
        endTime: `${endsAtDate.getUTCHours().toString().padStart(2, '0')}:${endsAtDate.getUTCMinutes().toString().padStart(2, '0')}`,
        durationMinutes: data.durationMinutes,
        activityType: data.activityType,
        players: data.players,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockBookings.push(booking)
      return booking
    }),
    getBookingsForDate: jest.fn(async (resourceId: string, date: string) => {
      return mockBookings.filter(b => 
        b.resourceId === resourceId && 
        b.date === date && 
        b.status === 'confirmed'
      )
    }),
  }
})

describe("Bookings API - POST Overlap", () => {
  beforeEach(() => {
    // Reset dei mock e dello stato interno
    const repo = require("@/lib/repo")
    if (repo.__resetMocks) {
      repo.__resetMocks()
    }
    jest.clearAllMocks()
  })

  test("crea una prenotazione valida", async () => {
    const requestBody = {
      customer: {
        firstName: "Mario",
        lastName: "Rossi",
        email: "mario.rossi@example.com",
        phone: "123456789",
        userType: "socio" as const,
      },
      date: "2024-12-25",
      startTime: "10:00",
      durationMinutes: 60,
      activityType: "9" as const,
      players: 2,
    }

    const request = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.booking).toBeDefined()
    expect(data.customer).toBeDefined()
    expect(data.booking.status).toBe("confirmed")
  })

  test("ritorna 409 quando c'è sovrapposizione", async () => {
    const { createBookingTx } = require("@/lib/repo")
    
    // Prima crea una prenotazione esistente
    await createBookingTx({
      resourceId: "trackman-io",
      customerId: "customer-1",
      startsAt: "2024-12-25T10:00:00Z",
      endsAt: "2024-12-25T11:00:00Z",
      durationMinutes: 60,
      activityType: "9",
      players: 2,
    })

    // Prova a creare una prenotazione che si sovrappone
    const requestBody = {
      customer: {
        firstName: "Luigi",
        lastName: "Bianchi",
        email: "luigi.bianchi@example.com",
        userType: "esterno" as const,
      },
      date: "2024-12-25",
      startTime: "10:30", // Si sovrappone con 10:00-11:00
      durationMinutes: 60,
      activityType: "18" as const,
      players: 1,
    }

    const request = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toContain("sovrappone")
    expect(data.code).toBe("OVERLAP")
  })

  test("non rileva sovrapposizione quando le prenotazioni sono separate", async () => {
    const { createBookingTx } = require("@/lib/repo")
    
    // Crea prima prenotazione
    await createBookingTx({
      resourceId: "trackman-io",
      customerId: "customer-1",
      startsAt: "2024-12-25T10:00:00Z",
      endsAt: "2024-12-25T11:00:00Z",
      durationMinutes: 60,
      activityType: "9",
      players: 2,
    })

    // Prenotazione che non si sovrappone
    const requestBody = {
      customer: {
        firstName: "Paolo",
        lastName: "Verdi",
        email: "paolo.verdi@example.com",
        userType: "socio" as const,
      },
      date: "2024-12-25",
      startTime: "14:00", // Non si sovrappone
      durationMinutes: 60,
      activityType: "9" as const,
      players: 2,
    }

    const request = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)

    expect(response.status).toBe(201) // Dovrebbe riuscire
  })

  test("ritorna 400 per dati mancanti", async () => {
    const requestBody = {
      customer: {
        firstName: "Mario",
        // lastName mancante
        email: "mario@example.com",
        userType: "socio" as const,
      },
      date: "2024-12-25",
      // startTime mancante
      durationMinutes: 60,
    }

    const request = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
