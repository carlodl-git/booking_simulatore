"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DateTime } from "luxon"
import { Calendar, X, Plus, Edit, Trash2, RefreshCw, LogOut } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import Link from "next/link"

interface Blackout {
  id: string
  resourceId: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  reason?: string
}

const formatDate = (dateStr: string) => {
  return DateTime.fromISO(dateStr).setZone("Europe/Rome").toFormat("dd/MM/yyyy")
}

export default function BlackoutsPage() {
  const [blackouts, setBlackouts] = useState<Blackout[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBlackout, setEditingBlackout] = useState<Blackout | null>(null)
  const [formData, setFormData] = useState({
    resourceId: "trackman-io",
    startDate: null as Date | null,
    endDate: null as Date | null,
    startTime: "",
    endTime: "",
    reason: "",
  })

  const loadBlackouts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/blackouts")
      if (!response.ok) throw new Error("Errore nel caricamento blackouts")
      const data = await response.json()
      setBlackouts(data.blackouts || [])
    } catch (error) {
      console.error("Errore:", error)
      alert("Errore nel caricamento blackouts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBlackouts()
  }, [])

  const handleOpenDialog = (blackout?: Blackout) => {
    if (blackout) {
      setEditingBlackout(blackout)
      setFormData({
        resourceId: blackout.resourceId,
        startDate: DateTime.fromISO(blackout.startDate).toJSDate(),
        endDate: DateTime.fromISO(blackout.endDate).toJSDate(),
        startTime: blackout.startTime || "",
        endTime: blackout.endTime || "",
        reason: blackout.reason || "",
      })
    } else {
      setEditingBlackout(null)
      setFormData({
        resourceId: "trackman-io",
        startDate: null,
        endDate: null,
        startTime: "",
        endTime: "",
        reason: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingBlackout(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.startDate || !formData.endDate) {
      alert("Seleziona data inizio e data fine")
      return
    }

    if (formData.endDate < formData.startDate) {
      alert("La data fine deve essere >= data inizio")
      return
    }

    if ((formData.startTime && !formData.endTime) || (!formData.startTime && formData.endTime)) {
      alert("Specifica entrambi gli orari o lascia entrambi vuoti")
      return
    }

    try {
      const startDateStr = DateTime.fromJSDate(formData.startDate).toISODate()!
      const endDateStr = DateTime.fromJSDate(formData.endDate).toISODate()!

      if (editingBlackout) {
        // Update
        const response = await fetch(`/api/admin/blackouts/${editingBlackout.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: startDateStr,
            endDate: endDateStr,
            startTime: formData.startTime || null,
            endTime: formData.endTime || null,
            reason: formData.reason || null,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Errore nell'aggiornamento")
        }
      } else {
        // Create
        const response = await fetch("/api/admin/blackouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resourceId: formData.resourceId,
            startDate: startDateStr,
            endDate: endDateStr,
            startTime: formData.startTime || undefined,
            endTime: formData.endTime || undefined,
            reason: formData.reason || undefined,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Errore nella creazione")
        }
      }

      handleCloseDialog()
      loadBlackouts()
    } catch (error) {
      console.error("Errore:", error)
      alert(error instanceof Error ? error.message : "Errore")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo blackout?")) return

    try {
      const response = await fetch(`/api/admin/blackouts/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Errore nell'eliminazione")
      }

      loadBlackouts()
    } catch (error) {
      console.error("Errore:", error)
      alert(error instanceof Error ? error.message : "Errore")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestione Blackout</h1>
            <p className="text-gray-600 mt-1">Gestisci eventi e chiusure</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadBlackouts} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna
            </Button>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Blackout
            </Button>
            <Link href="/admin/bookings">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Prenotazioni
              </Button>
            </Link>
            <Link href="/admin/logout">
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Blackout Attivi</CardTitle>
            <CardDescription>Lista di tutti i periodi di blackout configurati</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : blackouts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nessun blackout configurato</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Inizio</TableHead>
                    <TableHead>Data Fine</TableHead>
                    <TableHead>Orario</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Risorsa</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blackouts.map((blackout) => (
                    <TableRow key={blackout.id}>
                      <TableCell>{formatDate(blackout.startDate)}</TableCell>
                      <TableCell>{formatDate(blackout.endDate)}</TableCell>
                      <TableCell>
                        {blackout.startTime && blackout.endTime
                          ? `${blackout.startTime} - ${blackout.endTime}`
                          : "Tutto il giorno"}
                      </TableCell>
                      <TableCell>{blackout.reason || "-"}</TableCell>
                      <TableCell>{blackout.resourceId}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(blackout)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(blackout.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBlackout ? "Modifica Blackout" : "Nuovo Blackout"}
              </DialogTitle>
              <DialogDescription>
                Configura un periodo di blackout durante il quale non sarà possibile prenotare
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Inizio *</Label>
                  <DatePicker
                    date={formData.startDate}
                    onDateChange={(date) => setFormData({ ...formData, startDate: date as Date })}
                    placeholder="Seleziona data inizio"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fine *</Label>
                  <DatePicker
                    date={formData.endDate}
                    onDateChange={(date) => setFormData({ ...formData, endDate: date as Date })}
                    placeholder="Seleziona data fine"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Orario Inizio (opzionale)</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    placeholder="HH:mm"
                  />
                  <p className="text-xs text-gray-500">Lascia vuoto per tutto il giorno</p>
                </div>
                <div className="space-y-2">
                  <Label>Orario Fine (opzionale)</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    placeholder="HH:mm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo (opzionale)</Label>
                <Input
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Es: Evento speciale, Manutenzione..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Annulla
                </Button>
                <Button type="submit">
                  {editingBlackout ? "Aggiorna" : "Crea"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}


