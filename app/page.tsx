"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Globe2, 
  Users, 
  Calendar,
  Target,
  Users2,
  HelpCircle,
  CheckCircle2,
  CalendarCheck,
  Clock,
  Send,
  Phone,
  MessageCircle
} from "lucide-react"
import { useState } from "react"

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: "Serve essere soci?",
      a: "No, il simulatore TrackMan iO è aperto a tutti, soci e non soci del Golf della Montecchia."
    },
    {
      q: "Posso venire con un amico?",
      a: "Sì, puoi prenotare fino a 4 giocatori contemporaneamente per una sessione di gruppo."
    },
    {
      q: "È adatto ai principianti?",
      a: "Assolutamente sì! Il sistema fornisce feedback dettagliati e ti aiuta a migliorare il tuo gioco, indipendentemente dal tuo livello."
    },
    {
      q: "Posso allenarmi con il mio maestro?",
      a: "Certamente! Puoi prenotare sessioni di allenamento con il tuo maestro professionista per un&apos;analisi personalizzata del tuo swing."
    }
  ]

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-[url('/performance-bg.jpg')] bg-cover bg-center opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60"></div>
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative w-64 h-32 sm:w-80 sm:h-40">
        <Image
                src="/performance-center-logo.webp"
                alt="Montecchia Performance Center"
                fill
                className="object-contain"
          priority
        />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Scopri il nuovo simulatore{" "}
            <span className="text-teal-400">TrackMan iO</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-gray-200">
            Il nuovo simulatore indoor che ti permette di vivere il golf 365 giorni l&apos;anno — con dati reali e la precisione TrackMan.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/book">
              <Button size="lg" className="text-lg px-8 py-6 bg-red-600 hover:bg-red-700">
                Prenota ora
              </Button>
            </Link>
            <Link href="#what-is">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-white text-white bg-white/15 backdrop-blur-sm hover:bg-white hover:text-gray-900 transition-colors">
                Scopri di più
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What is TrackMan iO */}
      <section id="what-is" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Cos&apos;è TrackMan iO
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-4">
              TrackMan iO è l&apos;ultima generazione di simulatore indoor che utilizza tecnologia radar e intelligenza artificiale per analizzare ogni colpo.
            </p>
            <p className="text-lg sm:text-xl text-gray-600">
              Gioca sui campi più iconici del mondo o lavora sui tuoi dati con precisione da Tour.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="rounded-xl bg-white p-6 shadow-lg border border-slate-200 hover:border-teal-500 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-teal-600 p-3">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Analisi completa del colpo
                </h3>
              </div>
              <p className="text-gray-600">
                Velocità, spin, traiettoria
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg border border-slate-200 hover:border-teal-500 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-teal-600 p-3">
                  <Globe2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Gioca sui campi più belli del mondo
                </h3>
              </div>
              <p className="text-gray-600">
                Campi iconici sempre disponibili
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg border border-slate-200 hover:border-teal-500 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-teal-600 p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Allenati con il tuo maestro
                </h3>
              </div>
              <p className="text-gray-600">
                Anche indoor
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg border border-slate-200 hover:border-teal-500 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-teal-600 p-3">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Perfetto in ogni stagione
                </h3>
              </div>
              <p className="text-gray-600">
                365 giorni l&apos;anno
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl mx-auto">
            <div className="flex-1 relative aspect-video">
              <Image 
                src="/trackman-simulator.png" 
                alt="TrackMan iO Simulator" 
                fill
                className="rounded-xl shadow-2xl object-cover"
              />
            </div>
            <div className="flex-1 space-y-8">
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-teal-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Mantieni il tuo swing
                    </h3>
                    <p className="text-gray-600">
                      Anche nei mesi invernali, continua ad allenarti con la stessa qualità del campo estivo
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-teal-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Confrontati con i maestri
                    </h3>
                    <p className="text-gray-600">
                      Lezioni personalizzate con analisi dettagliata di ogni aspetto del tuo gioco
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-teal-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Partecipa a sfide e tornei
                    </h3>
                    <p className="text-gray-600">
                      Unisciti alla community e sfida altri giocatori in tornei virtuali
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Montecchia Performance Center */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Esperienza al Montecchia Performance Center
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Un ambiente professionale dove tecnologia e passione si incontrano
            </p>
          </div>

          <div className="mb-12 max-w-4xl mx-auto relative aspect-[21/9]">
            <Image
              src="/performance-center.jpg" 
              alt="Montecchia Performance Center" 
              fill
              className="rounded-xl shadow-2xl object-cover"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-xl bg-white p-8 shadow-lg border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-teal-600 p-3">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Setup Professionale
                </h3>
              </div>
              <p className="text-gray-600">
                Ambiente climatizzato e confortevole, con lo spazio giusto per swingare senza limitazioni
              </p>
            </div>

            <div className="rounded-xl bg-white p-8 shadow-lg border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-teal-600 p-3">
                  <Users2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Assistenza Dedicata
                </h3>
              </div>
              <p className="text-gray-600">
                Personale sempre disponibile per guidarti nell&apos;utilizzo del simulatore
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-teal-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Come funziona la prenotazione
              </h2>
              <p className="text-xl text-teal-100">
                Semplice, veloce e immediato
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-white/20 p-6">
                    <CalendarCheck className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">1. Scegli data e orario</h3>
                <p className="text-teal-50">
                  Seleziona la data che preferisci e l&apos;orario disponibile per la tua sessione sul simulatore TrackMan iO
                </p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-white/20 p-6">
                    <Clock className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">2. Personalizza la tua sessione</h3>
                <p className="text-teal-50">
                  Indica il numero di giocatori, il tipo di attività e la durata desiderata per la tua esperienza
                </p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-white/20 p-6">
                    <Send className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">3. Conferma e prenota</h3>
                <p className="text-teal-50">
                  Inserisci i tuoi dati, rivedi il riepilogo e conferma la prenotazione. Riceverai subito la conferma!
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/book">
                <Button size="lg" className="text-lg px-8 py-6 bg-red-600 hover:bg-red-700 text-white">
                   Prenota ora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <HelpCircle className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Domande Frequenti
              </h2>
              <p className="text-lg text-gray-600">
                Tutto quello che devi sapere sul TrackMan iO
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  className="rounded-lg bg-white border border-slate-200 overflow-hidden hover:border-teal-500 transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900">
                      {faq.q}
                    </span>
                    <span className="text-2xl text-teal-600">
                      {openFaq === idx ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 py-4 bg-slate-50 text-gray-600 border-t border-slate-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
    </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Contatti Montecchia Performance Center
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Per eventi o maggiori informazioni, contattaci direttamente
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="tel:+393314059134" 
                className="flex items-center gap-3 px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                <Phone className="h-5 w-5" />
                <span>Chiama ora</span>
              </a>
              
              <a 
                href="https://wa.me/393314059134?text=Ciao%2C%20vorrei%20maggiori%20informazioni%20sul%20simulatore%20TrackMan%20iO" 
          target="_blank"
          rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Scrivi su WhatsApp</span>
              </a>
            </div>
            
            <p className="text-gray-500 mt-6">
              <a href="tel:+393314059134" className="hover:text-teal-600 underline">
                +39 331 405 9134
              </a>
            </p>
          </div>
    </div>
      </section>
    </main>
  )
}
