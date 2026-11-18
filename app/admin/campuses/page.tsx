"use client"

import { useEffect, useState } from "react"
import { Building2, Plus, ShieldCheck, Zap, Wifi, Users, MapPin, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/store"
import type { Campus, Classroom } from "@/lib/types"

interface CampusWithClassrooms extends Campus {
  classrooms: Classroom[]
}

export default function AdminCampusesPage() {
  const { toast } = useToast()
  const { token } = useAuthStore()
  const [campuses, setCampuses] = useState<CampusWithClassrooms[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false)
  const [selectedCampusId, setSelectedCampusId] = useState<string>("")
  const [classroomName, setClassroomName] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [safeCapacity, setSafeCapacity] = useState("30")
  const [powerOutlets, setPowerOutlets] = useState("30")
  const [savingClassroom, setSavingClassroom] = useState(false)

  const loadCampuses = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/campuses", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load campuses")
      setCampuses(data.campuses || [])
    } catch (err: any) {
      toast({
        title: "Failed to load campuses",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      void loadCampuses()
    }
  }, [token])

  const handleAddClassroom = async () => {
    if (!classroomName.trim() || !selectedCampusId) {
      toast({ title: "Classroom name is required", variant: "destructive" })
      return
    }

    setSavingClassroom(true)
    try {
      const res = await fetch(`/api/campuses/${selectedCampusId}/classrooms`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: classroomName,
          roomNumber,
          safeCapacity: parseInt(safeCapacity, 10),
          powerOutletsCount: parseInt(powerOutlets, 10),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create classroom")

      toast({
        title: "Classroom Created",
        description: `Successfully added ${data.classroom.name} (Capacity: ${data.classroom.safeCapacity} seats).`,
      })

      setIsClassroomModalOpen(false)
      setClassroomName("")
      setRoomNumber("")
      void loadCampuses()
    } catch (err: any) {
      toast({
        title: "Failed to add classroom",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSavingClassroom(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#231651] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading campus and lab facilities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#231651] tracking-tight">
              Campuses & Computer Labs
            </h1>
            <Badge className="bg-[#D6FFF6] text-[#0A5C4A] hover:bg-[#D6FFF6] border-none font-semibold">
              Operational
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage physical learning centres, computer labs, power infrastructure, and maximum safe workstation capacities.
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        {campuses.map((campus) => (
          <Card key={campus.id} className="border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#231651]/5 to-transparent border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#231651]" />
                    <CardTitle className="text-xl text-[#231651]">{campus.name}</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {campus.address}, {campus.city}, {campus.state}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 text-xs py-1">
                    <Zap className="w-3 h-3 text-emerald-600" />
                    100% Guaranteed Generator & Solar
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 text-xs py-1">
                    <Wifi className="w-3 h-3 text-blue-600" />
                    Enterprise Fibre Wi-Fi
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 text-xs py-1">
                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                    Mandatory BYOL Labs
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#231651]">Classroom & Coding Labs</h3>
                  <p className="text-xs text-muted-foreground">
                    Physical capacity is strictly validated against usable desk space and power drop outlets.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-[#231651] hover:bg-[#150C33] text-white flex items-center gap-1.5"
                  onClick={() => {
                    setSelectedCampusId(campus.id)
                    setIsClassroomModalOpen(true)
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Lab / Classroom
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {campus.classrooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 rounded-xl border border-border/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-[#231651]">{room.name}</h4>
                        {room.roomNumber && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            Room {room.roomNumber}
                          </span>
                        )}
                      </div>
                      <Badge className="bg-[#D6FFF6] text-[#0A5C4A] border-none text-[11px] font-semibold">
                        Active Lab
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-3.5 h-3.5 text-[#231651]" />
                        <span>Capacity: <strong className="text-[#231651]">{room.safeCapacity}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Outlets: <strong className="text-[#231651]">{room.powerOutletsCount}</strong></span>
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Complies with atomic seat reservation limits
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Classroom Dialog */}
      <Dialog open={isClassroomModalOpen} onOpenChange={setIsClassroomModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Classroom or Computer Lab</DialogTitle>
            <DialogDescription>
              Configure a physical learning space with strict safe workstation capacity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="room-name">Classroom / Lab Name</Label>
              <Input
                id="room-name"
                placeholder="e.g. Lab 3 - Ada Lovelace Suite"
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room-number">Room / Suite Identifier (Optional)</Label>
              <Input
                id="room-number"
                placeholder="e.g. Room 204"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="room-capacity">Safe Seating Capacity</Label>
                <Input
                  id="room-capacity"
                  type="number"
                  min="5"
                  max="100"
                  value={safeCapacity}
                  onChange={(e) => setSafeCapacity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="room-outlets">Power Drop Outlets</Label>
                <Input
                  id="room-outlets"
                  type="number"
                  min="5"
                  max="100"
                  value={powerOutlets}
                  onChange={(e) => setPowerOutlets(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClassroomModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#231651] hover:bg-[#150C33] text-white"
              onClick={handleAddClassroom}
              disabled={savingClassroom}
            >
              {savingClassroom ? "Saving..." : "Create Classroom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
