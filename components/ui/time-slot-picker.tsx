"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TimeSlot {
  time: string
  available: boolean
}

interface TimeSlotPickerProps {
  selectedTime?: string
  onTimeSelect: (time: string) => void
  availableSlots?: TimeSlot[]
  occupiedSlots?: string[]
  className?: string
}

// Genera gli slot orari dalle 9:30 alle 23:00 ogni 30 minuti
function generateTimeSlots(occupiedSlots: string[] = []): TimeSlot[] {
  const slots: TimeSlot[] = []
  
  // Inizia alle 9:30
  slots.push({
    time: "09:30",
    available: !occupiedSlots.includes("09:30"),
  })
  
  // Continua dalle 10:00 alle 22:30 ogni 30 minuti
  for (let hour = 10; hour < 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      slots.push({
        time,
        available: !occupiedSlots.includes(time),
      })
    }
  }
  
  // Aggiungi 23:00 come ultimo slot
  slots.push({
    time: "23:00",
    available: !occupiedSlots.includes("23:00"),
  })
  
  return slots
}

export function TimeSlotPicker({
  selectedTime,
  onTimeSelect,
  availableSlots,
  occupiedSlots = [],
  className,
}: TimeSlotPickerProps) {
  // Se vengono passati slot custom, li usiamo, altrimenti generiamo quelli di default
  const slots = availableSlots || generateTimeSlots(occupiedSlots)

  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-sm font-medium">Seleziona un orario</div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map((slot) => (
          <Button
            key={slot.time}
            type="button"
            variant={selectedTime === slot.time ? "default" : "outline"}
            disabled={!slot.available}
            onClick={() => slot.available && onTimeSelect(slot.time)}
            className={cn(
              "h-10",
              selectedTime === slot.time && "bg-primary text-primary-foreground",
              !slot.available && "opacity-50 cursor-not-allowed line-through"
            )}
          >
            {slot.time}
          </Button>
        ))}
      </div>
      {slots.every((slot) => !slot.available) && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nessun orario disponibile per questa data
        </p>
      )}
    </div>
  )
}
