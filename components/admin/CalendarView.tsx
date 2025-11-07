"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DateTime } from "luxon"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import React from "react"

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  userType: string
}

interface Booking {
  id: string
  resourceId: string
  customerId: string
  startsAt: string
  endsAt: string
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
  activityType: string
  players: number
  notes?: string
  status: string
  createdAt: string
  updatedAt: string
  customer: Customer
}

interface CalendarViewProps {
  bookings: Booking[]
  onBookingClick: (booking: Booking) => void
}

const formatActivityType = (type: string) => {
  switch (type) {
    case "9": return "9 buche"
    case "18": return "18 buche"
    case "pratica": return "Campo Pratica"
    case "mini-giochi": return "Mini-giochi"
    default: return type
  }
}

// Genera gli slot orari dalle 09:30 alle 23:00 con intervalli di 30 minuti
const generateTimeSlots = () => {
  const slots = []
  slots.push("09:30") // Apertura
  for (let hour = 10; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      slots.push(timeStr)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

export function CalendarView({ bookings, onBookingClick }: CalendarViewProps) {
  const [viewDate, setViewDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week">("day")

  // Filtra prenotazioni per la data/giornata visualizzata
  const displayDate = DateTime.fromJSDate(viewDate).setZone("Europe/Rome")
  
  // Genera giorni da visualizzare
  const daysToShow: Date[] = []
  if (viewMode === "day") {
    daysToShow.push(displayDate.toJSDate())
  } else {
    // Settimana: 7 giorni a partire da domenica
    // Calcoliamo la domenica della settimana corrente
    const dayOfWeek = displayDate.weekday // 1=Lunedì, 7=Domenica
    // Sottraiamo per trovare la domenica: se siamo lunedì (1) sottraiamo 1, se martedì (2) sottraiamo 2, etc.
    // Domenica (7) rimane domenica (sottraiamo 0)
    const daysToSubtract = dayOfWeek === 7 ? 0 : dayOfWeek
    const sunday = displayDate.minus({ days: daysToSubtract })
    for (let i = 0; i < 7; i++) {
      daysToShow.push(sunday.plus({ days: i }).toJSDate())
    }
  }

  // Calcola periodo per filtrare bookings
  const startOfPeriod = viewMode === "day" 
    ? displayDate.startOf("day")
    : DateTime.fromJSDate(daysToShow[0]).startOf("day")
  const endOfPeriod = viewMode === "day"
    ? displayDate.endOf("day")
    : DateTime.fromJSDate(daysToShow[daysToShow.length - 1]).endOf("day")

  const filteredBookings = bookings.filter(booking => {
    // Usiamo direttamente le date ISO stringhe per il confronto
    const bookingDateStr = booking.date
    const startDateStr = viewMode === "day" ? displayDate.toFormat("yyyy-MM-dd") : DateTime.fromJSDate(daysToShow[0]).toFormat("yyyy-MM-dd")
    const endDateStr = viewMode === "day" ? displayDate.toFormat("yyyy-MM-dd") : DateTime.fromJSDate(daysToShow[daysToShow.length - 1]).toFormat("yyyy-MM-dd")
    return bookingDateStr >= startDateStr && bookingDateStr <= endDateStr
  })

  // Raggruppa le prenotazioni per data
  const bookingsByDate = filteredBookings.reduce((acc, booking) => {
    if (!acc[booking.date]) {
      acc[booking.date] = []
    }
    acc[booking.date].push(booking)
    return acc
  }, {} as Record<string, Booking[]>)
  
  // Funzioni di navigazione
  const goToPrevious = () => {
    if (viewMode === "day") {
      setViewDate(new Date(displayDate.minus({ days: 1 }).toJSDate()))
    } else {
      setViewDate(new Date(displayDate.minus({ weeks: 1 }).toJSDate()))
    }
  }

  const goToNext = () => {
    if (viewMode === "day") {
      setViewDate(new Date(displayDate.plus({ days: 1 }).toJSDate()))
    } else {
      setViewDate(new Date(displayDate.plus({ weeks: 1 }).toJSDate()))
    }
  }

  const goToToday = () => {
    setViewDate(new Date())
  }

  // Calcola l'altezza di una prenotazione
  const getBookingHeight = (booking: Booking): number => {
    const [startHours, startMinutes] = booking.startTime.split(":").map(Number)
    const [endHours, endMinutes] = booking.endTime.split(":").map(Number)
    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes
    const duration = endTotalMinutes - startTotalMinutes
    const slotHeight = 40 // Altezza di ogni slot di 30 minuti in px (ridotta per meno scroll)
    return (duration / 30) * slotHeight
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                onClick={() => setViewMode("day")}
              >
                Giorno
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
              >
                Settimana
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Oggi
              </Button>
              <Button variant="outline" size="icon" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <DatePicker
                date={viewDate}
                onDateChange={(date) => date && setViewDate(date)}
              />
            </div>
          </div>

          {/* Current Period Display */}
          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold">
              {viewMode === "day"
                ? displayDate.toFormat("EEEE, dd MMMM yyyy", { locale: "it" })
                : `${startOfPeriod.toFormat("dd MMM", { locale: "it" })} - ${endOfPeriod.toFormat("dd MMMM yyyy", { locale: "it" })}`}
            </h2>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <div className={viewMode === "week" ? "overflow-x-auto" : ""}>
        <div className={viewMode === "week" ? "inline-block min-w-full" : "w-full"}>
          <div
            className="grid border rounded-lg overflow-hidden w-full"
            style={{ gridTemplateColumns: `${viewMode === "day" ? "120px" : "100px"} repeat(${daysToShow.length}, 1fr)` }}
          >
            {/* Header: Time column + days */}
            <div className="border-r border-b bg-slate-100 p-2 font-semibold sticky left-0 z-10">
              Orario
            </div>
            {daysToShow.map((day, idx) => (
              <div key={idx} className="border-b bg-slate-100 p-2 font-semibold text-center">
                <div>{DateTime.fromJSDate(day).toFormat("EEE", { locale: "it" })}</div>
                <div className="text-sm text-gray-600">
                  {DateTime.fromJSDate(day).toFormat("dd MMM", { locale: "it" })}
                </div>
              </div>
            ))}

            {/* Time slots */}
            <div className="col-span-full grid w-full" style={{ gridTemplateColumns: `${viewMode === "day" ? "120px" : "100px"} repeat(${daysToShow.length}, 1fr)` }}>
              {TIME_SLOTS.map((timeSlot, idx) => (
                <React.Fragment key={timeSlot}>
                  {/* Time label */}
                  <div
                    className="border-r border-b bg-slate-50 text-xs text-gray-600 p-1 sticky left-0 z-10 h-[40px] flex items-start"
                  >
                    {idx % 2 === 0 && <span>{timeSlot}</span>}
                  </div>

                  {/* Day columns */}
                  {daysToShow.map((day, dayIdx) => {
                    const dayDateStr = DateTime.fromJSDate(day).toFormat("yyyy-MM-dd")
                    return (
                      <div
                        key={`${timeSlot}-${dayIdx}`}
                        className="border-b relative h-[40px]"
                      >
                        {/* Render bookings that start in this exact time slot */}
                        {bookingsByDate[dayDateStr]?.map(booking => {
                          // Only render if this booking starts at this exact time slot
                          if (booking.startTime === timeSlot) {
                            const height = getBookingHeight(booking)
                            return (
                              <div
                                key={booking.id}
                                className="absolute left-0 right-0 z-20 cursor-pointer hover:opacity-90 transition-opacity"
                                style={{
                                  top: "0px",
                                  height: `${height}px`,
                                }}
                                onClick={() => onBookingClick(booking)}
                              >
                                <div
                                  className={`h-full rounded px-2 py-1 text-xs overflow-hidden ${
                                    booking.customer.userType === "esterno"
                                      ? "bg-orange-100 border-l-4 border-orange-500"
                                      : "bg-teal-100 border-l-4 border-teal-600"
                                  } ${booking.status === "cancelled" ? "opacity-50 line-through" : ""}`}
                                >
                                  <div className="font-semibold truncate">
                                    {booking.customer.firstName} {booking.customer.lastName}
                                  </div>
                                  <div className="text-gray-600 text-[10px]">
                                    {booking.startTime} - {booking.endTime}
                                  </div>
                                  <div className="text-gray-600 text-[10px]">
                                    {formatActivityType(booking.activityType)}
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

