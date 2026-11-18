"use client"

import { useEffect, useState } from "react"
import { Calendar, Users, Plus, Clock, MapPin, Video, CheckCircle, AlertCircle, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/store"
import type { Cohort, ClassSession } from "@/lib/types"

export default function AdminCohortsPage() {
  const { toast } = useToast()
  const { token } = useAuthStore()
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)

  // Scheduling Dialog states
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null)
  const [sessionTitle, setSessionTitle] = useState("")
  const [sessionDescription, setSessionDescription] = useState("")
  const [activityType, setActivityType] = useState<ClassSession["activityType"]>("physical_practical")
  const [deliveryChannel, setDeliveryChannel] = useState<ClassSession["deliveryChannel"]>("physical")
  const [sessionDate, setSessionDate] = useState("")
  const [startTime, setStartTime] = useState("10:00")
  const [endTime, setEndTime] = useState("14:00")
  const [meetingUrl, setMeetingUrl] = useState("")
  const [maxCapacity, setMaxCapacity] = useState("30")
  const [savingSession, setSavingSession] = useState(false)

  const loadCohorts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cohorts", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load cohorts")
      setCohorts(data.cohorts || [])
    } catch (err: any) {
      toast({
        title: "Failed to load cohorts",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      void loadCohorts()
    }
  }, [token])

  const handleCreateSession = async () => {
    if (!sessionTitle.trim() || !sessionDate || !selectedCohort) {
      toast({ title: "Session title and date are required", variant: "destructive" })
      return
    }

    setSavingSession(true)
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cohortId: selectedCohort.id,
          title: sessionTitle,
          description: sessionDescription,
          activityType,
          deliveryChannel,
          sessionDate: new Date(sessionDate).toISOString(),
          startTime,
          endTime,
          meetingUrl: meetingUrl || undefined,
          maxCapacity: parseInt(maxCapacity, 10),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to schedule session")

      toast({
        title: "Session Scheduled",
        description: `Successfully scheduled "${data.session.title}" for ${selectedCohort.name}.`,
      })

      setIsSessionModalOpen(false)
      setSessionTitle("")
      setSessionDescription("")
      setMeetingUrl("")
    } catch (err: any) {
      toast({
        title: "Failed to schedule session",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSavingSession(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#231651] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading academic cohorts and schedules...</p>
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
              Cohorts & Timetables
            </h1>
            <Badge className="bg-[#D6FFF6] text-[#0A5C4A] hover:bg-[#D6FFF6] border-none font-semibold">
              Academic Term 2026
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage student cohorts, fixed academic timetables, synchronous virtual sessions, and in-person practical lab schedules.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {cohorts.map((cohort) => (
          <Card key={cohort.id} className="border-border/70 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#613399] bg-[#E8E3F5] px-2 py-0.5 rounded">
                      {cohort.code}
                    </span>
                    <CardTitle className="text-lg text-[#231651]">{cohort.name}</CardTitle>
                    <Badge
                      className={
                        cohort.deliveryArrangement === "hybrid"
                          ? "bg-[#231651] text-white border-none text-[11px]"
                          : "bg-blue-600 text-white border-none text-[11px]"
                      }
                    >
                      {cohort.deliveryArrangement === "hybrid" ? "Hybrid (Enugu Centre + Virtual)" : "Online-Only"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Term: {new Date(cohort.startDate).toLocaleDateString()} &mdash;{" "}
                    {new Date(cohort.endDate).toLocaleDateString()}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-[#231651] hover:bg-[#150C33] text-white text-xs flex items-center gap-1.5"
                    onClick={() => {
                      setSelectedCohort(cohort)
                      if (cohort.deliveryArrangement === "online") {
                        setActivityType("live_virtual")
                        setDeliveryChannel("online")
                      } else {
                        setActivityType("physical_practical")
                        setDeliveryChannel("physical")
                      }
                      setIsSessionModalOpen(true)
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Schedule Class Session
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 grid gap-6 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Fixed Timetable Summary
                </h4>
                <div className="p-3.5 rounded-lg border border-border/80 bg-white space-y-2 text-xs">
                  <p className="font-medium text-[#231651] leading-relaxed">
                    {cohort.fixedTimetableSummary || "Wednesday (17:00–19:00 UTC+1) Live Virtual Lecture | Saturday (10:00–14:00 UTC+1) Physical Practical Lab Workshop."}
                  </p>
                  <div className="flex items-center gap-4 text-muted-foreground pt-1 border-t border-border/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#613399]" />
                      Synchronous Attendance Enforced
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      Max Capacity: {cohort.maxCapacity} Seats
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Capacity & Attendance Policy
                </h4>
                <div className="p-3.5 rounded-lg border border-border/80 bg-slate-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Enrolment Status:</span>
                    <Badge variant="outline" className="font-medium capitalize text-emerald-700 bg-emerald-50 border-emerald-200">
                      {cohort.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Graduation Threshold:</span>
                    <strong className="text-[#231651]">75% Attendance</strong>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    Watching recorded video never satisfies live physical workshop attendance requirements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule Class Session Dialog */}
      <Dialog open={isSessionModalOpen} onOpenChange={setIsSessionModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Class Session</DialogTitle>
            <DialogDescription>
              Create a scheduled live lecture or physical lab session for {selectedCohort?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="session-title">Session Title</Label>
              <Input
                id="session-title"
                placeholder="e.g. Workshop: Distributed Microservices & Docker Lab"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Activity Type</Label>
                <Select
                  value={activityType}
                  onValueChange={(val: any) => setActivityType(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical_practical">Physical Practical Lab</SelectItem>
                    <SelectItem value="physical_class">Physical Lecture</SelectItem>
                    <SelectItem value="live_virtual">Live Virtual Class</SelectItem>
                    <SelectItem value="virtual_workshop">Virtual Workshop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Delivery Channel</Label>
                <Select
                  value={deliveryChannel}
                  onValueChange={(val: any) => setDeliveryChannel(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical Centre</SelectItem>
                    <SelectItem value="online">Online / Virtual</SelectItem>
                    <SelectItem value="simultaneous_hybrid">Simultaneous Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="session-date">Session Date</Label>
                <Input
                  id="session-date"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {deliveryChannel === "online" || activityType === "live_virtual" ? (
              <div className="space-y-1.5">
                <Label htmlFor="meeting-url">Meeting URL (Zoom / Google Meet)</Label>
                <Input
                  id="meeting-url"
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="session-desc">Session Description & Agenda</Label>
              <Textarea
                id="session-desc"
                placeholder="Bring your laptop charged with Docker Desktop pre-installed..."
                rows={2}
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSessionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#231651] hover:bg-[#150C33] text-white"
              onClick={handleCreateSession}
              disabled={savingSession}
            >
              {savingSession ? "Scheduling..." : "Confirm Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
