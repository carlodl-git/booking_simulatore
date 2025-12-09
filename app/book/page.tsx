"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { TimeSlotPicker } from "@/components/ui/time-slot-picker"
import { ArrowLeft, Clock, Loader2 } from "lucide-react"

const bookingSchema = z.object({
  firstName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  lastName: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
  email: z.string().email("Email non valida"),
  phone: z.string().optional(),
  userType: z.enum(["socio", "esterno"]).refine((val) => val !== undefined, {
    message: "Seleziona il tipo di utente",
  }),
  date: z.date({
    message: "Seleziona una data",
  }),
  time: z.string().min(1, "Seleziona un orario"),
  players: z
    .number({
      message: "Il numero di giocatori deve essere un numero",
    })
    .min(1, "Minimo 1 giocatore")
    .max(4, "Massimo 4 giocatori"),
  holes: z.enum(["9", "18", "pratica", "mini-giochi", "lezione-maestro"]).refine((val) => val !== undefined, {
    message: "Seleziona il tipo di attività",
  }),
  duration: z.enum(["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4"]).refine((val) => val !== undefined, {
    message: "Seleziona la durata",
  }),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: "È necessario accettare l'informativa sulla privacy",
  }),
})

type BookingFormValues = z.infer<typeof bookingSchema>

// Funzione per calcolare la durata consigliata
// Restituisce il valore da usare nel select (1, 1.5, 2, 2.5, 3, 3.5, 4)
function calculateDuration(
  players: number,
  holes: "9" | "18" | "pratica" | "mini-giochi" | "lezione-maestro"
): string {
  // Per lezione maestro, durata consigliata: 1h
  if (holes === "lezione-maestro") {
    return "1"
  }
  // Calcolo durata consigliata solo per 9 e 18 buche
  if (holes === "9" || holes === "18") {
    if (players === 1) {
      return holes === "9" ? "1" : "2"
    } else if (players === 2) {
      return holes === "9" ? "1.5" : "2.5"
    } else {
      // 3-4 giocatori
      return holes === "9" ? "2" : "4"
    }
  }
  // Per pratica e mini-giochi, durata consigliata di default: 1h
  return "1"
}

// Formatta la durata per la visualizzazione (es. "30 min", "1h", "1.5h")
function formatDuration(duration: string): string {
  if (duration === "0.5") {
    return "30 min"
  }
  return duration.includes(".") ? `${duration}h` : `${duration}h`
}

// Converte una Date in formato YYYY-MM-DD preservando il timezone locale
function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Calcola l'orario finale aggiungendo la durata all'orario iniziale
function calculateEndTime(startTime: string, duration: string): string {
  const [hours, minutes] = startTime.split(":").map(Number)
  const durationHours = parseFloat(duration)
  const totalMinutes = hours * 60 + minutes + durationHours * 60
  
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`
}

// Genera tutti gli slot tra orario iniziale e finale (intervalli di 30 minuti)
function generateTimeSlotsBetween(startTime: string, endTime: string): string[] {
  const slots: string[] = []
  const [startHours, startMinutes] = startTime.split(":").map(Number)
  const [endHours, endMinutes] = endTime.split(":").map(Number)
  
  let currentHours = startHours
  let currentMinutes = startMinutes
  
  while (
    currentHours < endHours ||
    (currentHours === endHours && currentMinutes < endMinutes)
  ) {
    const time = `${currentHours.toString().padStart(2, "0")}:${currentMinutes.toString().padStart(2, "0")}`
    slots.push(time)
    
    currentMinutes += 30
    if (currentMinutes >= 60) {
      currentMinutes = 0
      currentHours += 1
    }
  }
  
  return slots
}

// Verifica che tutti gli slot tra orario iniziale e finale siano disponibili
function checkAvailability(
  startTime: string,
  duration: string,
  occupiedSlots: string[]
): { available: boolean; conflictingSlots: string[] } {
  const endTime = calculateEndTime(startTime, duration)
  const requiredSlots = generateTimeSlotsBetween(startTime, endTime)
  
  // Usa Set per lookup O(1) invece di Array.includes() O(n)
  const occupiedSet = new Set(occupiedSlots)
  const conflictingSlots = requiredSlots.filter((slot) => occupiedSet.has(slot))
  
  return {
    available: conflictingSlots.length === 0,
    conflictingSlots,
  }
}

// Helper function to submit booking - separated to avoid Next.js build issues
async function submitBookingRequest(bookingData: {
  customer: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    userType: "socio" | "esterno"
  }
  startsAt: string
  durationMinutes: number
  activityType: string
  players: number
  resourceId: string
}) {
  const httpMethod = 'POST' as const
  const response = await fetch('/api/bookings', {
    method: httpMethod,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Errore durante l\'invio della prenotazione')
  }
  
  return response.json()
}

// This is a Next.js Page component - no route handlers should be exported from this file
export default function BookPage() {
  const [duration, setDuration] = useState<string>("")
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([])
  const [availabilityError, setAvailabilityError] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      userType: undefined,
      date: undefined,
      time: undefined,
      players: 1,
      holes: undefined,
      duration: undefined,
      privacyAccepted: false,
    },
  })

  const players = watch("players")
  const holes = watch("holes")
  const selectedDate = watch("date")
  const selectedTime = watch("time")
  const selectedDuration = watch("duration")
  

  const canConfirm = Boolean(selectedDate && selectedTime && selectedDuration && !availabilityError)

  // Calcola la durata quando cambiano giocatori o buche
  // Imposta automaticamente la durata consigliata se non è già stata selezionata
  useEffect(() => {
    if (players && holes) {
      const calculatedDuration = calculateDuration(
        players,
        holes as "9" | "18" | "pratica" | "mini-giochi" | "lezione-maestro"
      )
      
      const recommendedDuration = calculatedDuration
      
      setDuration(formatDuration(recommendedDuration))
      
      // Imposta automaticamente la durata solo se non è già stata selezionata
      if (!selectedDuration) {
        setValue(
          "duration",
          recommendedDuration as "0.5" | "1" | "1.5" | "2" | "2.5" | "3" | "3.5" | "4"
        )
      }
    } else {
      setDuration("")
    }
  }, [players, holes, selectedDuration, setValue])

  // Verifica disponibilità quando cambiano orario o durata
  useEffect(() => {
    if (selectedTime && selectedDuration) {
      const endTimeCalculated = calculateEndTime(selectedTime, selectedDuration)
      setEndTime(endTimeCalculated)
      
      const availability = checkAvailability(
        selectedTime,
        selectedDuration,
        occupiedSlots
      )
      
      if (!availability.available) {
        setAvailabilityError(
          `Attenzione: Gli orari ${availability.conflictingSlots.join(", ")} sono già occupati.`
        )
      } else {
        setAvailabilityError("")
      }
    } else {
      setEndTime("")
      setAvailabilityError("")
    }
  }, [selectedTime, selectedDuration, occupiedSlots])

  // Carica gli slot occupati quando cambia la data
  useEffect(() => {
    if (selectedDate) {
      // Reset del time selezionato quando cambia la data
      setValue("time", "")
      
      // Usa una durata fissa di 60 minuti per calcolare gli slot visualizzati
      // allOccupiedSlots mostrerà tutti gli slot realmente occupati
      const durationMinutes = 60
      
      // Carica gli slot occupati dall'API
      // Usa la data locale invece di UTC per evitare problemi di timezone
      const dateString = formatDateLocal(selectedDate)
      setSlotsLoading(true)
      
      // Lascia che la cache del server gestisca la validità dei dati
      const apiUrl = `/api/availability?date=${dateString}&durationMinutes=${durationMinutes}&resourceId=trackman-io`
      
      fetch(apiUrl, {
        method: 'GET',
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          
          // Assicurati che allOccupiedSlots sia un array
          const slots = Array.isArray(data.allOccupiedSlots) ? data.allOccupiedSlots : []
          
          // Normalizza gli slot per assicurarsi che siano nel formato HH:mm
          const normalizedSlots = slots.map((slot: string) => {
            if (typeof slot === 'string') {
              // Rimuovi eventuali secondi o millisecondi (es. "10:00:00" -> "10:00")
              return slot.split(':').slice(0, 2).join(':')
            }
            return slot
          })
          
          setOccupiedSlots(normalizedSlots)
        })
        .catch(err => {
          console.error('[BookPage] Errore nel caricamento disponibilità:', err)
          setOccupiedSlots([])
        })
        .finally(() => {
          setSlotsLoading(false)
        })
    } else {
      setOccupiedSlots([])
      setValue("time", "")
      setSlotsLoading(false)
    }
  }, [selectedDate, setValue])

  const onSubmit = async (data: BookingFormValues) => {
    try {
      // Converti la durata in minuti
      const durationMinutes = Math.round(parseFloat(data.duration) * 60)
      
      // Crea il timestamp startsAt combinando data e orario in Europe/Rome
      const selectedDateTime = new Date(data.date)
      const [hours, minutes] = data.time.split(':').map(Number)
      selectedDateTime.setHours(hours, minutes, 0, 0)
      
      // Converti in formato ISO con timezone Europe/Rome
      const year = selectedDateTime.getFullYear()
      const month = String(selectedDateTime.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDateTime.getDate()).padStart(2, '0')
      const startsAt = `${year}-${month}-${day}T${data.time}:00+01:00`
      
      // Prepara i dati per l'API
      const bookingData = {
        customer: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || undefined,
          userType: data.userType,
        },
        startsAt,
        durationMinutes,
        activityType: data.holes,
        players: data.players,
        resourceId: "trackman-io",
      }
      
      // Invia la richiesta all'API usando la funzione helper
      const result = await submitBookingRequest(bookingData)
      console.log('Booking created:', result)
      
      // Redirect alla pagina di successo con recap
      const qp = new URLSearchParams({
        id: result.booking.id,
        date: result.booking.date,
        startTime: result.booking.startTime,
        endTime: result.booking.endTime,
        duration: `${result.booking.durationMinutes} min`,
        players: String(result.booking.players),
        activity: String(result.booking.activityType),
        name: `${data.firstName} ${data.lastName}`,
      })
      window.location.href = `/book/success?${qp.toString()}`
      
    } catch (error: unknown) {
      console.error("Errore nella prenotazione:", error)
      const message = error instanceof Error ? error.message : "Errore imprevisto"
      alert(`Errore: ${message}`)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla home
        </Link>

        <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-2">
            Prenotazione Simulatore
          </h1>
          <p className="text-gray-600 mb-8">
            Compila il form per prenotare la tua sessione
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Data */}
            <div className="space-y-2">
              <Label>
                Data <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                date={watch("date")}
                onDateChange={(date) => {
                  setValue("date", date as Date)
                }}
                placeholder="Seleziona una data"
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message}</p>
              )}
            </div>

            {/* Seleziona orari disponibili dopo la selezione della data */}
            {selectedDate && (
              <div className="space-y-2">
                <Label>
                  Orario <span className="text-red-500">*</span>
                </Label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                    <span className="ml-2 text-gray-600">Caricamento orari disponibili...</span>
                  </div>
                ) : (
                  <TimeSlotPicker
                    selectedTime={selectedTime}
                    onTimeSelect={(time) => setValue("time", time)}
                    occupiedSlots={occupiedSlots}
                  />
                )}
                {errors.time && (
                  <p className="text-sm text-red-500">{errors.time.message}</p>
                )}
              </div>
            )}

            {/* Numero giocatori */}
            <div className="space-y-2">
              <Label htmlFor="players">
                Numero giocatori <span className="text-red-500">*</span>
              </Label>
              <Input
                id="players"
                type="number"
                min={1}
                max={4}
                {...register("players", { valueAsNumber: true })}
              />
              {errors.players && (
                <p className="text-sm text-red-500">{errors.players.message}</p>
              )}
            </div>

            {/* Tipo attività */}
            <div className="space-y-2">
              <Label htmlFor="holes">
                Tipo attività <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch("holes")}
                onValueChange={(value) =>
                  setValue("holes", value as "9" | "18" | "pratica" | "mini-giochi" | "lezione-maestro")
                }
              >
                <SelectTrigger id="holes">
                  <SelectValue placeholder="Seleziona tipo di attività" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">9 buche</SelectItem>
                  <SelectItem value="18">18 buche</SelectItem>
                  <SelectItem value="pratica">Campo Pratica</SelectItem>
                  <SelectItem value="mini-giochi">Mini-giochi</SelectItem>
                  <SelectItem value="lezione-maestro">Lezione maestro</SelectItem>
                  {/* DEBUG: Versione aggiornata - 2025-01-15 */}
                </SelectContent>
              </Select>
              {errors.holes && (
                <p className="text-sm text-red-500">{errors.holes.message}</p>
              )}
            </div>

            {/* Durata */}
            <div className="space-y-2">
              <Label htmlFor="duration">
                Durata <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedDuration}
                onValueChange={(value) =>
                  setValue(
                    "duration",
                    value as "0.5" | "1" | "1.5" | "2" | "2.5" | "3" | "3.5" | "4"
                  )
                }
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Seleziona la durata" />
                </SelectTrigger>
                <SelectContent>
                  {holes === "lezione-maestro" && (
                    <SelectItem value="0.5">30 minuti</SelectItem>
                  )}
                  <SelectItem value="1">1 ora</SelectItem>
                  {holes !== "lezione-maestro" && (
                    <>
                  <SelectItem value="1.5">1.5 ore</SelectItem>
                  <SelectItem value="2">2 ore</SelectItem>
                  <SelectItem value="2.5">2.5 ore</SelectItem>
                  <SelectItem value="3">3 ore</SelectItem>
                  <SelectItem value="3.5">3.5 ore</SelectItem>
                  <SelectItem value="4">4 ore</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {errors.duration && (
                <p className="text-sm text-red-500">{errors.duration.message}</p>
              )}
              {duration && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Durata consigliata in base ai parametri selezionati: {duration}
                </p>
              )}
            </div>

            {/* Recap orario */}
            {selectedTime && selectedDuration && endTime && (
              <div className="rounded-lg border border-border bg-accent/50 p-4 space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Riepilogo Orario
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Orario iniziale</p>
                    <p className="text-lg font-medium">{selectedTime}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Orario finale</p>
                    <p className="text-lg font-medium">{endTime}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Durata</p>
                    <p className="text-lg font-medium">{formatDuration(selectedDuration)}</p>
                  </div>
                </div>
                {availabilityError && (
                  <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive font-medium">
                      {availabilityError}
                    </p>
                  </div>
                )}
                {!availabilityError && selectedTime && selectedDuration && (
                  <>
                  <div className="mt-3 p-3 rounded-md bg-teal-50 border border-teal-200">
                    <p className="text-sm text-teal-800 font-medium">
                      ✓ Tutti gli slot sono disponibili
                    </p>
                  </div>
                    {/* Box informativo sul costo - nascosto per lezione maestro */}
                    {holes !== "lezione-maestro" && (
                      <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4">
                        <p className="text-sm text-teal-800">
                          <span className="font-semibold">💰 Tariffa:</span> Il costo del simulatore è di <span className="font-bold">20€ l&apos;ora</span> per i soci e <span className="font-bold">25€ l&apos;ora</span> per i non soci, indipendentemente dal numero di giocatori.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 2: Dati per conferma (mostrati solo quando selezioni completati) */}
            {canConfirm ? (
              <div className="space-y-4">
                <div className="pt-2">
                  <h3 className="text-lg font-semibold">Dati per conferma</h3>
                  <p className="text-sm text-muted-foreground">Inserisci i tuoi dati per confermare la prenotazione</p>
                </div>

                {/* Nome e Cognome */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input id="firstName" {...register("firstName")} placeholder="Mario" />
                    {errors.firstName && (
                      <p className="text-sm text-red-500">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Cognome <span className="text-red-500">*</span>
                    </Label>
                    <Input id="lastName" {...register("lastName")} placeholder="Rossi" />
                    {errors.lastName && (
                      <p className="text-sm text-red-500">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email e Telefono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input id="email" type="email" {...register("email")} placeholder="mario.rossi@example.com" />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono</Label>
                    <Input id="phone" type="tel" {...register("phone")} placeholder="+39 123 456 7890" />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Tipo utente */}
                <div className="space-y-2">
                  <Label htmlFor="userType">
                    Tipo utente <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(value) => setValue("userType", value as "socio" | "esterno")}>
                    <SelectTrigger id="userType">
                      <SelectValue placeholder="Seleziona tipo utente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="socio">Socio</SelectItem>
                      <SelectItem value="esterno">Esterno</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.userType && (
                    <p className="text-sm text-red-500">{errors.userType.message}</p>
                  )}
                </div>

                {/* Privacy Policy Acceptance */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="privacyAccepted"
                      {...register("privacyAccepted")}
                      className="mt-1 h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <Label htmlFor="privacyAccepted" className="text-sm text-gray-700 cursor-pointer leading-5">
                      Ho letto e accetto l&apos;<a href="/privacy" target="_blank" className="text-teal-600 hover:underline font-medium">informativa sulla privacy</a> di Golf della Montecchia S.r.l.
                    </Label>
                  </div>
                  {errors.privacyAccepted && (
                    <p className="text-sm text-red-500">{errors.privacyAccepted.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isSubmitting || !!availabilityError} size="lg">
                  {isSubmitting ? "Invio in corso..." : "Conferma prenotazione"}
                </Button>
              </div>
            ) : (
              <Button type="button" className="w-full" disabled size="lg">
                Seleziona data, attività, durata e orario
              </Button>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}

