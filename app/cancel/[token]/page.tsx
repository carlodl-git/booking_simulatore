'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { XCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

function CancelBookingContent() {
  const params = useParams()
  const token = params.token as string
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')
  const [booking, setBooking] = useState<any>(null)
  const [errorCode, setErrorCode] = useState<string>('')
  const [hoursUntilBooking, setHoursUntilBooking] = useState<number | null>(null)
  const [hoursPassed, setHoursPassed] = useState<number | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token di cancellazione non valido')
      return
    }

    // Chiama l'API per cancellare la prenotazione
    fetch(`/api/bookings/cancel/${token}`)
      .then(async (response) => {
        const data = await response.json()
        
        if (!response.ok) {
          setStatus('error')
          setErrorCode(data.code || '')
          
          // Messaggio personalizzato per scadenza 24h
          if (data.code === 'CANCELLATION_EXPIRED') {
            const hoursUntil = data.hoursUntilBooking || 0
            const hoursPassedValue = data.hoursPassed || 0
            setHoursUntilBooking(hoursUntil)
            setHoursPassed(hoursPassedValue)
            
            if (hoursPassedValue > 0) {
              setMessage(`La prenotazione può essere cancellata solo entro 24 ore prima dell'orario prenotato. L'orario della prenotazione è già passato di ${Math.round(hoursPassedValue)} ore.`)
            } else {
              setMessage(`La prenotazione può essere cancellata solo entro 24 ore prima dell'orario prenotato. Mancano ${Math.round(-hoursUntil)} ore all'orario prenotato.`)
            }
          } else {
            setMessage(data.error || 'Errore durante la cancellazione')
          }
          
          // Mostra i dettagli della prenotazione anche in caso di errore
          if (data.booking) {
            setBooking(data.booking)
          }
          return
        }

        setStatus('success')
        setMessage(data.message || 'Prenotazione cancellata con successo')
        setBooking(data.booking)
      })
      .catch((error) => {
        console.error('Errore:', error)
        setStatus('error')
        setMessage('Errore durante la cancellazione. Riprova più tardi.')
      })
  }, [token])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
          {status === 'loading' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Cancellazione in corso...
              </h1>
              <p className="text-gray-600">
                Attendere prego, stiamo cancellando la tua prenotazione.
              </p>
            </div>
          )}

          {status === 'success' && (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Prenotazione Cancellata
                </h1>
              </div>
              
              <p className="text-gray-600 mb-6">
                {message}
              </p>

              {booking && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h2 className="font-semibold text-gray-900 mb-2">Dettagli prenotazione cancellata:</h2>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Data:</strong> {booking.date}</p>
                    <p><strong>Orario:</strong> {booking.startTime} – {booking.endTime}</p>
                    <p><strong>ID Prenotazione:</strong> {booking.id}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Prenota un nuovo slot
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Torna alla home
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {errorCode === 'CANCELLATION_EXPIRED' ? 'Tempo Scaduto' : 'Errore nella Cancellazione'}
                </h1>
              </div>
              
              <p className="text-gray-600 mb-6">
                {message}
              </p>

              {errorCode === 'CANCELLATION_EXPIRED' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-800">
                    <strong>Nota:</strong> Per cancellare una prenotazione quando mancano meno di 24 ore all'orario prenotato, contatta direttamente il Montecchia Performance Center.
                  </p>
                </div>
              )}

              {booking && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h2 className="font-semibold text-gray-900 mb-2">Dettagli prenotazione:</h2>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Data:</strong> {booking.date}</p>
                    <p><strong>Orario:</strong> {booking.startTime} – {booking.endTime}</p>
                    <p><strong>ID Prenotazione:</strong> {booking.id}</p>
                    {hoursUntilBooking !== null && hoursUntilBooking < 0 && hoursPassed !== null && (
                      <p><strong>Orario prenotazione:</strong> già passato di {Math.round(hoursPassed)} ore</p>
                    )}
                    {hoursUntilBooking !== null && hoursUntilBooking >= 0 && (
                      <p><strong>Tempo rimanente:</strong> {Math.round(-hoursUntilBooking)} ore all'orario prenotato</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Torna alla home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function CancelBookingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8 text-center">
            <Loader2 className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Caricamento...</p>
          </div>
        </div>
      </main>
    }>
      <CancelBookingContent />
    </Suspense>
  )
}

