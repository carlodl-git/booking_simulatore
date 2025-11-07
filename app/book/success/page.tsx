"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Share2, Mail, MessageCircle } from "lucide-react"
import { Suspense, useState } from "react"

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<FallbackContent />}>
      <BookingSuccessContent />
    </Suspense>
  )
}

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const [showShareMenu, setShowShareMenu] = useState(false)
  const id = searchParams.get("id")
  const date = searchParams.get("date")
  const startTime = searchParams.get("startTime")
  const endTime = searchParams.get("endTime")
  const duration = searchParams.get("duration")
  const players = searchParams.get("players")
  const activity = searchParams.get("activity")
  const name = searchParams.get("name")

  // Google Calendar link (Europe/Rome)
  const gcLink = (() => {
    if (!date || !startTime || !endTime) return null
    const ymd = date.replace(/-/g, "")
    const start = `${ymd}T${startTime.replace(":", "")}00`
    const end = `${ymd}T${endTime.replace(":", "")}00`
    const base = "https://calendar.google.com/calendar/render?action=TEMPLATE"
    const title = encodeURIComponent("Prenotazione Trackman iO")
    const details = encodeURIComponent(
      [
        activity ? `Attività: ${activity}` : undefined,
        players ? `Giocatori: ${players}` : undefined,
        id ? `ID: ${id}` : undefined,
      ]
        .filter(Boolean)
        .join("\n")
    )
    const ctz = encodeURIComponent("Europe/Rome")
    return `${base}&text=${title}&dates=${start}/${end}&details=${details}&ctz=${ctz}`
  })()

  // Funzione per generare il messaggio di condivisione
  const shareMessage = () => {
    const details = [
      `📅 Prenotazione Trackman iO - Montecchia Performance Center`,
      ``,
      id ? `ID: ${id}` : '',
      date ? `📆 Data: ${date}` : '',
      (startTime || endTime) ? `⏰ Orario: ${startTime} – ${endTime}` : '',
      duration ? `⏱️ Durata: ${duration}` : '',
      players ? `👥 Giocatori: ${players}` : '',
      activity ? `🏌️ Attività: ${activity}` : '',
      ``,
      `Montecchia Golf Club, Via Montecchia, 12, 35030 Selvazzano Dentro PD`
    ].filter(Boolean).join('\n')
    return details
  }

  // Email link
  const handleEmailShare = () => {
    const subject = encodeURIComponent("Prenotazione Trackman iO - Montecchia Performance Center")
    const body = encodeURIComponent(shareMessage())
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    setShowShareMenu(false)
  }

  // WhatsApp link
  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(shareMessage())
    window.open(`https://wa.me/?text=${message}`, '_blank')
    setShowShareMenu(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-12 w-12 text-teal-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Prenotazione confermata
            </h1>
          </div>
          <p className="text-gray-600 mb-6">
            Grazie{name ? `, ${name}` : ""}! La tua prenotazione è stata registrata correttamente.
          </p>

          <div className="space-y-2 text-sm">
            {id && (
              <p><span className="font-medium">ID prenotazione:</span> {id}</p>
            )}
            {date && (
              <p><span className="font-medium">Data:</span> {date}</p>
            )}
            {(startTime || endTime) && (
              <p><span className="font-medium">Orario:</span> {startTime} {endTime ? `– ${endTime}` : ""}</p>
            )}
            {duration && (
              <p><span className="font-medium">Durata:</span> {duration}</p>
            )}
            {players && (
              <p><span className="font-medium">Giocatori:</span> {players}</p>
            )}
            {activity && (
              <p><span className="font-medium">Attività:</span> {activity}</p>
            )}
          </div>

          <div className="mt-8 flex gap-3 flex-wrap">
            <Link href="/book">
              <Button variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50">
                Nuova prenotazione
              </Button>
            </Link>
            {gcLink && (
              <a href={gcLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50">
                  Aggiungi a Google Calendar
                </Button>
              </a>
            )}
            
            {/* Share dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                className="border-teal-600 text-teal-600 hover:bg-teal-50"
                onClick={() => setShowShareMenu(!showShareMenu)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Condividi
              </Button>
              
              {showShareMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowShareMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                      <button
                        onClick={handleEmailShare}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Mail className="mr-3 h-5 w-5" />
                        Condividi via Email
                      </button>
                      <button
                        onClick={handleWhatsAppShare}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <MessageCircle className="mr-3 h-5 w-5" />
                        Condividi via WhatsApp
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700">
                Torna alla home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function FallbackContent() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8 text-gray-600">
          Caricamento dettagli prenotazione...
        </div>
      </div>
    </main>
  )
}
