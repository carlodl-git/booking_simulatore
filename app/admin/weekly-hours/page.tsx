"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Clock, RefreshCw, LogOut, Edit, Save, X } from "lucide-react"
import Link from "next/link"

interface WeeklyHours {
  id: string
  resourceId: string
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
  createdAt: string
  updatedAt: string
}

const DAY_NAMES = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
]

export default function WeeklyHoursPage() {
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    openTime: "",
    closeTime: "",
    isClosed: false,
  })

  const loadWeeklyHours = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/weekly-hours")
      if (!response.ok) throw new Error("Errore nel caricamento orari")
      const data = await response.json()
      setWeeklyHours(data.weeklyHours || [])
    } catch (error) {
      console.error("Errore:", error)
      alert("Errore nel caricamento orari")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWeeklyHours()
  }, [])

  const handleEdit = (day: WeeklyHours) => {
    setEditingDay(day.dayOfWeek)
    setFormData({
      openTime: day.openTime,
      closeTime: day.closeTime,
      isClosed: day.isClosed,
    })
  }

  const handleCancel = () => {
    setEditingDay(null)
    setFormData({
      openTime: "",
      closeTime: "",
      isClosed: false,
    })
  }

  const handleSave = async (dayOfWeek: number) => {
    if (!formData.isClosed && (!formData.openTime || !formData.closeTime)) {
      alert("Specifica gli orari di apertura e chiusura")
      return
    }

    // Validazione formato orari
    if (!formData.isClosed) {
      const timeRegex = /^\d{2}:\d{2}$/
      if (!timeRegex.test(formData.openTime) || !timeRegex.test(formData.closeTime)) {
        alert("Formato orari non valido. Usa HH:mm")
        return
      }

      // Validazione: closeTime deve essere > openTime
      const [openHours, openMinutes] = formData.openTime.split(":").map(Number)
      const [closeHours, closeMinutes] = formData.closeTime.split(":").map(Number)
      const openTotalMinutes = openHours * 60 + openMinutes
      const closeTotalMinutes = closeHours * 60 + closeMinutes

      if (closeTotalMinutes <= openTotalMinutes) {
        alert("L'orario di chiusura deve essere maggiore dell'orario di apertura")
        return
      }
    }

    try {
      const response = await fetch("/api/admin/weekly-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek,
          openTime: formData.isClosed ? "09:30" : formData.openTime,
          closeTime: formData.isClosed ? "23:00" : formData.closeTime,
          isClosed: formData.isClosed,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Errore nel salvataggio")
      }

      handleCancel()
      loadWeeklyHours()
    } catch (error) {
      console.error("Errore:", error)
      alert(error instanceof Error ? error.message : "Errore")
    }
  }

  const getWeeklyHoursForDay = (dayOfWeek: number): WeeklyHours | undefined => {
    return weeklyHours.find((wh) => wh.dayOfWeek === dayOfWeek)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orari Settimanali</h1>
            <p className="text-gray-600 mt-1">Gestisci gli orari di apertura e chiusura per ogni giorno della settimana</p>
            <p className="text-sm text-gray-500 mt-1">
              Le prenotazioni "Lezione maestro" possono essere effettuate anche fuori dagli orari di apertura
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadWeeklyHours} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna
            </Button>
            <Link href="/admin/bookings">
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
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
            <CardTitle>Orari di Apertura</CardTitle>
            <CardDescription>Configura gli orari per ogni giorno della settimana</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Giorno</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Orario Apertura</TableHead>
                    <TableHead>Orario Chiusura</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                    const dayHours = getWeeklyHoursForDay(dayOfWeek)
                    const isEditing = editingDay === dayOfWeek

                    return (
                      <TableRow key={dayOfWeek}>
                        <TableCell className="font-medium">
                          {DAY_NAMES[dayOfWeek]}
                        </TableCell>
                        {isEditing ? (
                          <>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.isClosed}
                                  onChange={(e) =>
                                    setFormData({ ...formData, isClosed: e.target.checked })
                                  }
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label className={formData.isClosed ? "text-gray-500" : ""}>
                                  {formData.isClosed ? "Chiuso" : "Aperto"}
                                </Label>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={formData.openTime}
                                onChange={(e) =>
                                  setFormData({ ...formData, openTime: e.target.value })
                                }
                                disabled={formData.isClosed}
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={formData.closeTime}
                                onChange={(e) =>
                                  setFormData({ ...formData, closeTime: e.target.value })
                                }
                                disabled={formData.isClosed}
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSave(dayOfWeek)}
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Salva
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancel}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Annulla
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>
                              <span className={dayHours?.isClosed ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                                {dayHours?.isClosed ? "Chiuso" : "Aperto"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {dayHours?.isClosed ? (
                                <span className="text-gray-400">-</span>
                              ) : (
                                dayHours?.openTime || "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {dayHours?.isClosed ? (
                                <span className="text-gray-400">-</span>
                              ) : (
                                dayHours?.closeTime || "-"
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => dayHours && handleEdit(dayHours)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

