"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TimeSlot {
  time: string
  available: boolean
}

interface OpeningHours {
  openTime: string
  closeTime: string
}

interface TimeSlotPickerProps {
  selectedTime?: string
  onTimeSelect: (time: string) => void
  availableSlots?: TimeSlot[]
  occupiedSlots?: string[]
  openingHours?: OpeningHours | null
  className?: string
}

const DEFAULT_OPEN = "09:30"
const DEFAULT_CLOSE = "23:00"

type SlotState = "selected" | "free" | "free_not_bookable" | "occupied"

interface RenderSlot {
  time: string
  state: SlotState
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

function normalize(time: string): string {
  return time.split(":").slice(0, 2).join(":")
}

function generateRange(openTime: string, closeTime: string): string[] {
  const slots: string[] = []
  const end = toMinutes(closeTime)
  for (let t = toMinutes(openTime); t <= end; t += 30) {
    slots.push(fromMinutes(t))
  }
  return slots
}

interface Section {
  label: string
  slots: RenderSlot[]
  freeCount: number
}

function groupBySection(slots: RenderSlot[]): Section[] {
  const sections: Record<string, RenderSlot[]> = {
    Mattina: [],
    Pomeriggio: [],
    Sera: [],
  }
  for (const slot of slots) {
    const mins = toMinutes(slot.time)
    if (mins < 13 * 60) sections["Mattina"].push(slot)
    else if (mins < 18 * 60) sections["Pomeriggio"].push(slot)
    else sections["Sera"].push(slot)
  }
  return Object.entries(sections)
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({
      label,
      slots: list,
      freeCount: list.filter((s) => s.state === "free" || s.state === "selected").length,
    }))
}

export function TimeSlotPicker({
  selectedTime,
  onTimeSelect,
  availableSlots,
  occupiedSlots = [],
  openingHours,
  className,
}: TimeSlotPickerProps) {
  const openTime = openingHours?.openTime ?? DEFAULT_OPEN
  const closeTime = openingHours?.closeTime ?? DEFAULT_CLOSE

  const occupiedSet = React.useMemo(
    () => new Set(occupiedSlots.map(normalize)),
    [occupiedSlots]
  )

  const bookableSet = React.useMemo(() => {
    if (!availableSlots) return null
    return new Set(
      availableSlots.filter((s) => s.available).map((s) => normalize(s.time))
    )
  }, [availableSlots])

  const slots: RenderSlot[] = React.useMemo(() => {
    return generateRange(openTime, closeTime).map((time) => {
      if (time === selectedTime) return { time, state: "selected" as const }
      if (occupiedSet.has(time)) return { time, state: "occupied" as const }
      if (bookableSet === null) return { time, state: "free" as const }
      if (bookableSet.has(time)) return { time, state: "free" as const }
      return { time, state: "free_not_bookable" as const }
    })
  }, [openTime, closeTime, selectedTime, occupiedSet, bookableSet])

  const sections = groupBySection(slots)
  const totalFree = sections.reduce((sum, s) => sum + s.freeCount, 0)

  if (totalFree === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="text-sm font-medium">Seleziona un orario</div>
        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-muted-foreground">
          Nessun orario disponibile per questa data
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Seleziona un orario</div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-100 ring-1 ring-emerald-300" />
            disponibile
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-200 ring-1 ring-slate-300" />
            occupato
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {sections.map((section, sectionIdx) => (
          <div key={section.label}>
            <div
              className={cn(
                "flex items-center justify-between bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600",
                sectionIdx > 0 && "border-t border-slate-200"
              )}
            >
              <span>{section.label}</span>
              <span className="font-normal normal-case text-slate-500">
                {section.freeCount} {section.freeCount === 1 ? "libero" : "liberi"}
              </span>
            </div>
            {section.slots.map((slot) => (
              <SlotRow
                key={slot.time}
                slot={slot}
                onSelect={() => onTimeSelect(slot.time)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SlotRow({
  slot,
  onSelect,
}: {
  slot: RenderSlot
  onSelect: () => void
}) {
  const clickable = slot.state === "free" || slot.state === "selected"

  const stateClasses: Record<SlotState, string> = {
    selected:
      "bg-emerald-600 text-white hover:bg-emerald-600 focus-visible:ring-emerald-700",
    free:
      "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 focus-visible:ring-emerald-500",
    free_not_bookable:
      "bg-emerald-50/40 text-emerald-900/40 cursor-not-allowed",
    occupied: "bg-slate-100 text-slate-500 cursor-not-allowed",
  }

  const label: Record<SlotState, string> = {
    selected: "Selezionato",
    free: "Disponibile",
    free_not_bookable: "—",
    occupied: "Occupato",
  }

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onSelect}
      aria-label={`${slot.time} — ${label[slot.state]}`}
      className={cn(
        "flex w-full items-center text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        stateClasses[slot.state]
      )}
    >
      <span className="w-14 shrink-0 px-3 py-2 text-sm font-medium tabular-nums">
        {slot.time}
      </span>
      <span className="flex-1 px-3 py-2 text-sm">{label[slot.state]}</span>
    </button>
  )
}
