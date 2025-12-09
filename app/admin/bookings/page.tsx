"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DateTime } from "luxon"
import { Calendar, X, Download, Search, Filter, List, Grid, RefreshCw, LogOut, Ban, Euro } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { CalendarView } from "@/components/admin/CalendarView"
import Link from "next/link"

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
  // Campi snapshot dalla prenotazione (nome/cognome al momento della prenotazione)
  customerFirstName?: string
  customerLastName?: string
}

const formatDate = (dateStr: string) => {
  return DateTime.fromISO(dateStr).setZone("Europe/Rome").toFormat("dd/MM/yyyy")
}

const formatActivityType = (type: string) => {
  switch (type) {
    case "9": return "9 buche"
    case "18": return "18 buche"
    case "pratica": return "Campo Pratica"
    case "mini-giochi": return "Mini-giochi"
    case "lezione-maestro": return "Lezione maestro"
    default: return type
  }
}

interface Blackout {
  id: string
  resourceId: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  reason?: string
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blackouts, setBlackouts] = useState<Blackout[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table")
  const [totalMaestroOwed, setTotalMaestroOwed] = useState<number | null>(null) // null = loading
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      // Lascia che la cache del server gestisca la validità dei dati
      const response = await fetch(`/api/admin/bookings`, {
        credentials: 'include', // Include cookies in the request
      })
      
      if (!response.ok) {
        throw new Error("Error fetching bookings")
      }
      
      const data = await response.json()
      const fetchedBookings = data.bookings || []
      setBookings(fetchedBookings)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Memoizza "today" per evitare di calcolarlo ad ogni render
  const today = useMemo(() => DateTime.now().setZone("Europe/Rome").startOf("day"), [])

  // Ottimizza il filtering con useMemo invece di useCallback
  const filteredBookings = useMemo(() => {
    // Filter out past bookings first
    let filtered = bookings.filter(booking => {
      const bookingDate = DateTime.fromISO(booking.date).setZone("Europe/Rome").startOf("day")
      const isFuture = bookingDate >= today
      // Escludi anche le prenotazioni cancellate
      const isNotCancelled = booking.status !== "cancelled"
      return isFuture && isNotCancelled
    })

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.customer?.firstName.toLowerCase().includes(query) ||
        booking.customer?.lastName.toLowerCase().includes(query) ||
        booking.customer?.email.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // User type filter
    if (userTypeFilter !== "all") {
      filtered = filtered.filter(booking => booking.customer?.userType === userTypeFilter)
    }

    // Date filter
    if (dateFilter) {
      const filterDateStr = DateTime.fromJSDate(dateFilter).setZone("Europe/Rome").toFormat("yyyy-MM-dd")
      filtered = filtered.filter(booking => booking.date === filterDateStr)
    }

    // Sort by date/time ascending (upcoming first)
    return [...filtered].sort((a, b) => {
      const dateA = DateTime.fromISO(a.startsAt).setZone("Europe/Rome")
      const dateB = DateTime.fromISO(b.startsAt).setZone("Europe/Rome")
      return dateA.toMillis() - dateB.toMillis()
    })
  }, [bookings, dateFilter, searchQuery, statusFilter, userTypeFilter, today])

  const loadBlackouts = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/blackouts")
      if (!response.ok) throw new Error("Errore nel caricamento blackouts")
      const data = await response.json()
      setBlackouts(data.blackouts || [])
    } catch (error) {
      console.error("Errore nel caricamento blackouts:", error)
      // Non bloccare se i blackout non si caricano
    }
  }, [])

  const fetchTotalMaestroOwed = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/maestri`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error("Error fetching maestro totals")
      }
      
      const data = await response.json()
      setTotalMaestroOwed(data.totalOwed || 0)
    } catch (error) {
      console.error("Error fetching maestro totals:", error)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
    loadBlackouts()
    fetchTotalMaestroOwed()
  }, [fetchBookings, loadBlackouts, fetchTotalMaestroOwed])

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    
    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "PATCH",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" })
      })

      if (response.ok) {
        setIsModalOpen(false)
        fetchBookings()
      } else {
        alert("Errore durante la cancellazione della prenotazione")
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      alert("Errore durante la cancellazione della prenotazione")
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/admin/export-csv", {
        method: "GET",
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `prenotazioni-${DateTime.now().toFormat("yyyy-MM-dd")}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting CSV:", error)
      alert("Errore durante l'esportazione CSV")
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

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Caricamento prenotazioni...</div>
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
                <CardTitle className="text-2xl font-bold">Gestione Prenotazioni</CardTitle>
                <CardDescription>Montecchia Performance Center - TrackMan iO Simulator</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchBookings} variant="outline" className="w-full md:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Aggiorna
                </Button>
                <Button onClick={handleExportCSV} className="w-full md:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Esporta CSV
                </Button>
                <Button onClick={handleLogout} variant="outline" className="w-full md:w-auto">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Maestro Payments Summary */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Euro className="h-6 w-6 text-orange-600" />
                <div>
                  <CardTitle className="text-lg">Totale dovuto dai Maestri</CardTitle>
                  <CardDescription>Lezioni passate non ancora saldate</CardDescription>
                </div>
              </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-orange-600">
                      {totalMaestroOwed === null ? "-" : `€${totalMaestroOwed.toFixed(2)}`}
                    </div>
                  </div>
                  <Link href="/admin/maestri">
                    <Button variant="default" className="bg-orange-600 hover:bg-orange-700">
                      Gestisci Pagamenti
                    </Button>
                  </Link>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cerca</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nome, cognome, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Stato</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="confirmed">Confermate</SelectItem>
                    <SelectItem value="cancelled">Cancellate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo Utente</label>
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="socio">Socio</SelectItem>
                    <SelectItem value="esterno">Esterno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <DatePicker
                  date={dateFilter}
                  onDateChange={setDateFilter}
                  placeholder="Seleziona data..."
                />
              </div>
            </div>

            {/* Clear filters */}
            {(searchQuery || statusFilter !== "all" || userTypeFilter !== "all" || dateFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setUserTypeFilter("all")
                  setDateFilter(undefined)
                }}
                className="mt-4"
              >
                <X className="mr-2 h-4 w-4" />
                Rimuovi filtri
              </Button>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 mt-4">
              I filtri vengono applicati solo sulla vista tabellare
            </p>
          </CardContent>
        </Card>

        {/* View Toggle */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <CardTitle>
                Prenotazioni ({filteredBookings.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  onClick={() => setViewMode("table")}
                  size="sm"
                >
                  <List className="mr-2 h-4 w-4" />
                  Tabella
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  onClick={() => setViewMode("calendar")}
                  size="sm"
                >
                  <Grid className="mr-2 h-4 w-4" />
                  Calendario
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        {viewMode === "table" && (
          <Card>
            <CardContent className="pt-6">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Nessuna prenotazione trovata
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Orario</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Giocatori</TableHead>
                      <TableHead>Attività</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => {
                      const today = DateTime.now().setZone("Europe/Rome").startOf("day")
                      const bookingDate = DateTime.fromISO(booking.date).setZone("Europe/Rome").startOf("day")
                      const isToday = bookingDate.hasSame(today, "day")
                      
                      return (
                      <TableRow key={booking.id} className={isToday ? "bg-teal-50 hover:bg-teal-100 border-l-4 border-teal-600" : ""}>
                        <TableCell className="font-medium">
                          {formatDate(booking.date)}
                          {isToday && <Badge variant="outline" className="ml-2 border-teal-600 text-teal-700">Oggi</Badge>}
                        </TableCell>
                        <TableCell>
                          {booking.startTime} - {booking.endTime}
                        </TableCell>
                        <TableCell>
                          {booking.customerFirstName || ''} {booking.customerLastName || ''}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {booking.customer?.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={booking.customer?.userType === "socio" ? "default" : "secondary"}
                            className={booking.customer?.userType === "esterno" ? "border-orange-500" : ""}
                          >
                            {booking.customer?.userType === "socio" ? "Socio" : "Esterno"}
                          </Badge>
                        </TableCell>
                        <TableCell>{booking.players}</TableCell>
                        <TableCell>{formatActivityType(booking.activityType)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={booking.status === "confirmed" ? "default" : "outline"}
                            className={
                              booking.status === "confirmed"
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-gray-500 hover:bg-gray-600"
                            }
                          >
                            {booking.status === "confirmed" ? "Confermata" : "Cancellata"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookingClick(booking)}
                          >
                            Dettagli
                          </Button>
                        </TableCell>
                      </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <CalendarView
            bookings={bookings}
            blackouts={blackouts}
            onBookingClick={handleBookingClick}
          />
        )}
      </div>

      {/* Booking Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettagli Prenotazione</DialogTitle>
            <DialogDescription>
              ID: {selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <p className="text-lg">{selectedBooking.customerFirstName || ''} {selectedBooking.customerLastName || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{selectedBooking.customer?.email}</p>
                </div>
                {selectedBooking.customer?.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefono</label>
                    <p className="text-lg">{selectedBooking.customer.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo Utente</label>
                  <Badge className={selectedBooking.customer?.userType === "esterno" ? "border-orange-500" : ""}>
                    {selectedBooking.customer?.userType === "socio" ? "Socio" : "Esterno"}
                  </Badge>
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Data</label>
                  <p className="text-lg">{formatDate(selectedBooking.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Orario</label>
                  <p className="text-lg">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Durata</label>
                  <p className="text-lg">{selectedBooking.durationMinutes} minuti</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Giocatori</label>
                  <p className="text-lg">{selectedBooking.players}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Attività</label>
                  <p className="text-lg">{formatActivityType(selectedBooking.activityType)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Stato</label>
                  <Badge
                    variant={selectedBooking.status === "confirmed" ? "default" : "outline"}
                    className={
                      selectedBooking.status === "confirmed"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gray-500 hover:bg-gray-600"
                    }
                  >
                    {selectedBooking.status === "confirmed" ? "Confermata" : "Cancellata"}
                  </Badge>
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Note</label>
                  <p className="text-lg">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Actions */}
              {selectedBooking.status === "confirmed" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Sei sicuro di voler cancellare questa prenotazione?")) {
                        handleCancelBooking()
                      }
                    }}
                  >
                    Cancella Prenotazione
                  </Button>
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Chiudi
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Historical Bookings Link */}
      <Card className="mt-6">
        <CardContent className="pt-6 space-y-2">
          <Link href="/admin/bookings/history">
            <Button variant="outline" className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Storico Prenotazioni
            </Button>
          </Link>
          <Link href="/admin/blackouts">
            <Button variant="outline" className="w-full">
              <Ban className="mr-2 h-4 w-4" />
              Gestione Blackout
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

