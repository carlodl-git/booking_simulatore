"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DateTime } from "luxon"
import { ArrowLeft, RefreshCw, LogOut, Euro, CheckCircle, XCircle, Calendar, X } from "lucide-react"
import Link from "next/link"
import { DatePicker } from "@/components/ui/date-picker"

interface MaestroSummary {
  maestroEmail: string
  maestroNames: string[] // Array di nomi per lo stesso maestro (stessa email)
  totalOwed: number
  totalPaid: number
  pendingAmount: number
  lessonsCount: number
  paidLessonsCount: number
}

interface MaestroPayment {
  id: string
  bookingId: string
  maestroName: string
  maestroEmail: string
  amount: number
  paid: boolean
  paidAt?: string
  notDue: boolean
  createdAt: string
  updatedAt: string
  booking: {
    id: string
    date: string
    startTime: string
    endTime: string
    adminNotes?: string
    customer: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

const formatDate = (dateStr: string) => {
  return DateTime.fromISO(dateStr).setZone("Europe/Rome").toFormat("dd/MM/yyyy")
}

export default function MaestriPage() {
  const [summaries, setSummaries] = useState<MaestroSummary[]>([])
  const [totalOwed, setTotalOwed] = useState<number>(0)
  const [totalPaid, setTotalPaid] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [selectedMaestroEmail, setSelectedMaestroEmail] = useState<string | null>(null)
  const [maestroPayments, setMaestroPayments] = useState<MaestroPayment[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [selectedBookingForNotes, setSelectedBookingForNotes] = useState<{ bookingId: string; adminNotes: string } | null>(null)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState<string>("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  const fetchSummaries = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) {
        params.append('startDate', DateTime.fromJSDate(startDate).setZone("Europe/Rome").toFormat("yyyy-MM-dd"))
      }
      if (endDate) {
        params.append('endDate', DateTime.fromJSDate(endDate).setZone("Europe/Rome").toFormat("yyyy-MM-dd"))
      }
      
      const response = await fetch(`/api/admin/maestri?${params.toString()}`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error("Error fetching maestro summaries")
      }
      
      const data = await response.json()
      setSummaries(data.summaries || [])
      setTotalOwed(data.totalOwed || 0)
      setTotalPaid(data.totalPaid || 0)
    } catch (error) {
      console.error("Error fetching summaries:", error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  const fetchMaestroPayments = useCallback(async (maestroEmail: string) => {
    try {
      setLoadingPayments(true)
      const encodedEmail = encodeURIComponent(maestroEmail)
      const response = await fetch(`/api/admin/maestri/${encodedEmail}`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error("Error fetching maestro payments")
      }
      
      const data = await response.json()
      setMaestroPayments(data.payments || [])
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoadingPayments(false)
    }
  }, [])

  const handleMaestroClick = async (maestroEmail: string) => {
    setSelectedMaestroEmail(maestroEmail)
    setIsModalOpen(true)
    await fetchMaestroPayments(maestroEmail)
  }

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/maestri/payments/${paymentId}`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'paid' })
      })

      if (response.ok) {
        // Aggiorna la lista dei pagamenti
        if (selectedMaestroEmail) {
          await fetchMaestroPayments(selectedMaestroEmail)
        }
        // Aggiorna i riepiloghi
        await fetchSummaries()
      } else {
        alert("Errore durante l'aggiornamento del pagamento")
      }
    } catch (error) {
      console.error("Error marking payment as paid:", error)
      alert("Errore durante l'aggiornamento del pagamento")
    }
  }

  const handleMarkAsUnpaid = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/maestri/payments/${paymentId}`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'unpaid' })
      })

      if (response.ok) {
        // Aggiorna la lista dei pagamenti
        if (selectedMaestroEmail) {
          await fetchMaestroPayments(selectedMaestroEmail)
        }
        // Aggiorna i riepiloghi
        await fetchSummaries()
      } else {
        alert("Errore durante l'aggiornamento del pagamento")
      }
    } catch (error) {
      console.error("Error marking payment as unpaid:", error)
      alert("Errore durante l'aggiornamento del pagamento")
    }
  }

  const handleMarkAsNotDue = async (paymentId: string) => {
    if (!confirm("Sei sicuro di voler segnare questa lezione come 'pagamento non dovuto'? Questo rimuoverà la lezione dal calcolo dei soldi da pagare ma non la inserirà nell'incasso storico.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/maestri/payments/${paymentId}`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'not_due' })
      })

      if (response.ok) {
        // Aggiorna la lista dei pagamenti
        if (selectedMaestroEmail) {
          await fetchMaestroPayments(selectedMaestroEmail)
        }
        // Aggiorna i riepiloghi
        await fetchSummaries()
      } else {
        alert("Errore durante l'aggiornamento del pagamento")
      }
    } catch (error) {
      console.error("Error marking payment as not due:", error)
      alert("Errore durante l'aggiornamento del pagamento")
    }
  }

  const handleMarkAsDue = async (paymentId: string) => {
    if (!confirm("Sei sicuro di voler ripristinare questa lezione come 'da pagare'? Questo la rimetterà nel calcolo dei soldi da pagare.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/maestri/payments/${paymentId}`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'due' })
      })

      if (response.ok) {
        // Aggiorna la lista dei pagamenti
        if (selectedMaestroEmail) {
          await fetchMaestroPayments(selectedMaestroEmail)
        }
        // Aggiorna i riepiloghi
        await fetchSummaries()
      } else {
        alert("Errore durante l'aggiornamento del pagamento")
      }
    } catch (error) {
      console.error("Error marking payment as due:", error)
      alert("Errore durante l'aggiornamento del pagamento")
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { 
        method: "POST",
        credentials: 'include'
      })
      window.location.href = "/admin/login"
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const handleEditNotes = (payment: MaestroPayment) => {
    setSelectedBookingForNotes({ bookingId: payment.booking.id, adminNotes: payment.booking.adminNotes || "" })
    setAdminNotes(payment.booking.adminNotes || "")
    setIsNotesModalOpen(true)
  }

  const handleSaveAdminNotes = async () => {
    if (!selectedBookingForNotes) return

    setIsSavingNotes(true)
    try {
      const response = await fetch(`/api/admin/bookings/${selectedBookingForNotes.bookingId}`, {
        method: "PATCH",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: adminNotes || null })
      })

      if (response.ok) {
        const data = await response.json()
        // Aggiorna la lista dei pagamenti
        if (selectedMaestroEmail) {
          await fetchMaestroPayments(selectedMaestroEmail)
        }
        setIsNotesModalOpen(false)
        setSelectedBookingForNotes(null)
      } else {
        alert("Errore durante il salvataggio delle note")
      }
    } catch (error) {
      console.error("Error saving admin notes:", error)
      alert("Errore durante il salvataggio delle note")
    } finally {
      setIsSavingNotes(false)
    }
  }

  useEffect(() => {
    fetchSummaries()
  }, [fetchSummaries, startDate, endDate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Caricamento pagamenti maestri...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">Gestione Pagamenti Maestri</CardTitle>
                <CardDescription>Montecchia Performance Center - Lezioni Maestro</CardDescription>
              </div>
              <div className="flex gap-2">
                <Link href="/admin/bookings">
                  <Button variant="outline" className="w-full md:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Torna alle Prenotazioni
                  </Button>
                </Link>
                <Button onClick={fetchSummaries} variant="outline" className="w-full md:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Aggiorna
                </Button>
                <Button onClick={handleLogout} variant="outline" className="w-full md:w-auto">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Total Summary */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Euro className="h-6 w-6 text-orange-600" />
                <div>
                  <CardTitle className="text-lg">Totale Dovuto</CardTitle>
                  <CardDescription>Da tutti i maestri</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-orange-600">
                  €{totalOwed.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maestri Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riepilogo per Maestro</CardTitle>
            <CardDescription>Clicca su un maestro per vedere i dettagli dei pagamenti</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {summaries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Nessun pagamento da gestire
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Maestro</TableHead>
                      <TableHead>Lezioni Totali</TableHead>
                      <TableHead>Lezioni Saldate</TableHead>
                      <TableHead>Totale Dovuto</TableHead>
                      <TableHead>Totale Pagato</TableHead>
                      <TableHead>Da Pagare</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaries.map((summary) => (
                      <TableRow key={summary.maestroEmail}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">
                              {summary.maestroNames.join(', ')}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {summary.maestroEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{summary.lessonsCount}</TableCell>
                        <TableCell>{summary.paidLessonsCount}</TableCell>
                        <TableCell>€{summary.totalOwed.toFixed(2)}</TableCell>
                        <TableCell>€{summary.totalPaid.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={summary.pendingAmount > 0 ? "destructive" : "default"}
                            className={summary.pendingAmount > 0 ? "bg-orange-500" : "bg-green-500"}
                          >
                            €{summary.pendingAmount.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMaestroClick(summary.maestroEmail)}
                          >
                            Dettagli
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Paid Summary */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Totale Storico Incassato
            </CardTitle>
            <CardDescription>Filtra per periodo per vedere l&apos;incasso in un determinato range di date</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Date Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Inizio</label>
                  <DatePicker
                    date={startDate}
                    onDateChange={setStartDate}
                    placeholder="Seleziona data inizio..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Fine</label>
                  <DatePicker
                    date={endDate}
                    onDateChange={setEndDate}
                    placeholder="Seleziona data fine..."
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStartDate(undefined)
                      setEndDate(undefined)
                    }}
                    className="w-full"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Rimuovi Filtri
                  </Button>
                </div>
              </div>

              {/* Total Paid Display */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Euro className="h-6 w-6 text-green-600" />
                  <div>
                    <CardTitle className="text-lg">
                      {startDate || endDate ? "Totale Incassato (Periodo Selezionato)" : "Totale Storico Incassato"}
                    </CardTitle>
                    <CardDescription>
                      {startDate && endDate
                        ? `Dal ${DateTime.fromJSDate(startDate).setZone("Europe/Rome").toFormat("dd/MM/yyyy")} al ${DateTime.fromJSDate(endDate).setZone("Europe/Rome").toFormat("dd/MM/yyyy")}`
                        : startDate
                        ? `Dal ${DateTime.fromJSDate(startDate).setZone("Europe/Rome").toFormat("dd/MM/yyyy")}`
                        : endDate
                        ? `Fino al ${DateTime.fromJSDate(endDate).setZone("Europe/Rome").toFormat("dd/MM/yyyy")}`
                        : "Tutti i pagamenti saldati"}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-green-600">
                    €{totalPaid.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maestro Payments Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Pagamenti - {summaries.find(s => s.maestroEmail === selectedMaestroEmail)?.maestroNames.join(', ') || selectedMaestroEmail}
            </DialogTitle>
            <DialogDescription>
              Gestisci i pagamenti per le lezioni di questo maestro
              {selectedMaestroEmail && (
                <div className="text-xs text-gray-500 mt-1">
                  {selectedMaestroEmail}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {loadingPayments ? (
            <div className="text-center py-8">Caricamento pagamenti...</div>
          ) : maestroPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nessun pagamento trovato per questo maestro
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Orario</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Note Admin</TableHead>
                      <TableHead>Importo</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maestroPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {formatDate(payment.booking.date)}
                        </TableCell>
                        <TableCell>
                          {payment.booking.startTime} - {payment.booking.endTime}
                        </TableCell>
                        <TableCell>
                          {payment.booking.customer.firstName} {payment.booking.customer.lastName}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {payment.booking.adminNotes ? (
                            <p className="text-sm text-gray-700 truncate" title={payment.booking.adminNotes}>
                              {payment.booking.adminNotes}
                            </p>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 text-xs"
                            onClick={() => handleEditNotes(payment)}
                          >
                            {payment.booking.adminNotes ? "Modifica" : "Aggiungi"}
                          </Button>
                        </TableCell>
                        <TableCell>€{payment.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={payment.notDue ? "secondary" : payment.paid ? "default" : "destructive"}
                            className={payment.notDue ? "bg-gray-400" : payment.paid ? "bg-green-500" : "bg-orange-500"}
                          >
                            {payment.notDue ? (
                              <>
                                <XCircle className="mr-1 h-3 w-3" />
                                Non dovuto
                              </>
                            ) : payment.paid ? (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Saldato
                              </>
                            ) : (
                              <>
                                <XCircle className="mr-1 h-3 w-3" />
                                Da pagare
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {payment.notDue ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleMarkAsDue(payment.id)}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Ripristina come Da Pagare
                              </Button>
                            ) : payment.paid ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsUnpaid(payment.id)}
                              >
                                Annulla Pagamento
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleMarkAsPaid(payment.id)}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Segna come Saldato
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                  onClick={() => handleMarkAsNotDue(payment.id)}
                                >
                                  <XCircle className="mr-1 h-4 w-4" />
                                  Pagamento non dovuto
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Notes Modal */}
      <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Note Admin - Prenotazione</DialogTitle>
            <DialogDescription>
              Aggiungi o modifica le note admin per questa prenotazione
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Note Admin</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Aggiungi note per questa prenotazione..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsNotesModalOpen(false)
                  setSelectedBookingForNotes(null)
                }}
              >
                Annulla
              </Button>
              <Button
                onClick={handleSaveAdminNotes}
                disabled={isSavingNotes}
              >
                {isSavingNotes ? "Salvataggio..." : "Salva Note"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

