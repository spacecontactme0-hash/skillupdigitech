"use client"

import { useEffect, useState } from "react"
import { Calendar, Users, CheckCircle2, XCircle, Clock, MapPin, Video, Search, Filter, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/store"
import type { ClassSession, AttendanceRecord } from "@/lib/types"

interface RosterMember {
  membershipId: string
  studentId: string
  programmeEnrolmentId: string
  studentName: string
  studentEmail: string
  studentAvatar?: string | null
  attendance: AttendanceRecord | null
}

export default function InstructorAttendancePage() {
  const { toast } = useToast()
  const { user, token } = useAuthStore()

  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null)
  const [roster, setRoster] = useState<RosterMember[]>([])
  const [summary, setSummary] = useState({
    totalEnrolled: 0,
    markedCount: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
  })
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Load instructor sessions
  useEffect(() => {
    const fetchSessions = async () => {
      setLoadingSessions(true)
      try {
        const res = await fetch("/api/sessions", {
          headers: { Authorization: `Bearer ${token || ""}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to load sessions")

        const list: ClassSession[] = data.sessions || []
        setSessions(list)
        if (list.length > 0 && !selectedSessionId) {
          setSelectedSessionId(list[0].id)
        }
      } catch (err: any) {
        toast({
          title: "Failed to load sessions",
          description: err.message,
          variant: "destructive",
        })
      } finally {
        setLoadingSessions(false)
      }
    }

    if (token) {
      void fetchSessions()
    }
  }, [token])

  // Load roster and attendance for selected session
  useEffect(() => {
    if (!selectedSessionId || !token) return

    const fetchRoster = async () => {
      setLoadingRoster(true)
      try {
        const res = await fetch(`/api/sessions/${selectedSessionId}/attendance`, {
          headers: { Authorization: `Bearer ${token || ""}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to load roster")

        setSelectedSession(data.session)
        setRoster(data.roster || [])
        setSummary(data.summary || {
          totalEnrolled: 0,
          markedCount: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
        })
      } catch (err: any) {
        toast({
          title: "Failed to load attendance roster",
          description: err.message,
          variant: "destructive",
        })
      } finally {
        setLoadingRoster(false)
      }
    }

    void fetchRoster()
  }, [selectedSessionId, token])

  const handleMarkAttendance = async (
    member: RosterMember,
    status: "present" | "absent" | "late",
  ) => {
    if (!selectedSession) return

    setUpdatingStudentId(member.studentId)
    const channel = selectedSession.deliveryChannel === "physical" ? "physical" : "virtual"

    try {
      const res = await fetch(`/api/sessions/${selectedSession.id}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          studentId: member.studentId,
          programmeEnrolmentId: member.programmeEnrolmentId,
          attendanceStatus: status,
          attendanceChannel: channel,
          notes: `Verified by faculty instructor ${user?.name || ""}`,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update attendance")

      // Update local state smoothly
      setRoster((prev) =>
        prev.map((m) =>
          m.studentId === member.studentId
            ? { ...m, attendance: data.record }
            : m,
        ),
      )

      // Recalculate summary counts
      setSummary((prev) => {
        const oldStatus = member.attendance?.attendanceStatus
        const isNewRecord = !oldStatus

        return {
          ...prev,
          markedCount: isNewRecord ? prev.markedCount + 1 : prev.markedCount,
          presentCount:
            status === "present"
              ? oldStatus === "present" ? prev.presentCount : prev.presentCount + 1
              : oldStatus === "present" ? Math.max(0, prev.presentCount - 1) : prev.presentCount,
          absentCount:
            status === "absent"
              ? oldStatus === "absent" ? prev.absentCount : prev.absentCount + 1
              : oldStatus === "absent" ? Math.max(0, prev.absentCount - 1) : prev.absentCount,
          lateCount:
            status === "late"
              ? oldStatus === "late" ? prev.lateCount : prev.lateCount + 1
              : oldStatus === "late" ? Math.max(0, prev.lateCount - 1) : prev.lateCount,
        }
      })

      toast({
        title: "Attendance Recorded",
        description: `${member.studentName} marked as ${status.toUpperCase()} (${channel}).`,
      })
    } catch (err: any) {
      toast({
        title: "Error saving attendance",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setUpdatingStudentId(null)
    }
  }

  const filteredRoster = roster.filter((m) =>
    m.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#231651] tracking-tight">
              Class Attendance Console
            </h1>
            <Badge className="bg-[#D6FFF6] text-[#0A5C4A] hover:bg-[#D6FFF6] border-none font-semibold">
              Live Roster Check-In
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Mark official attendance for physical coding lab workshops and scheduled live virtual classes.
          </p>
        </div>

        {sessions.length > 0 && (
          <div className="w-full sm:w-72">
            <Select
              value={selectedSessionId}
              onValueChange={setSelectedSessionId}
            >
              <SelectTrigger className="w-full bg-white border-border/80 text-xs sm:text-sm font-medium">
                <SelectValue placeholder="Select class session..." />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title} ({new Date(s.sessionDate).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {loadingSessions ? (
        <div className="p-8 flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#231651] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading instructor sessions...</p>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold text-[#231651]">No Class Sessions Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            There are currently no scheduled classes assigned to your instructor profile.
          </p>
        </Card>
      ) : selectedSession ? (
        <div className="space-y-6">
          {/* Session Overview Card */}
          <Card className="border-border/70 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg text-[#231651]">{selectedSession.title}</CardTitle>
                    <Badge
                      className={
                        selectedSession.deliveryChannel === "physical"
                          ? "bg-[#231651] text-white border-none text-[11px]"
                          : "bg-blue-600 text-white border-none text-[11px]"
                      }
                    >
                      {selectedSession.deliveryChannel === "physical"
                        ? "Physical Lab Workshop (14 Garden Ave, Enugu)"
                        : "Live Virtual Class"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#613399]" />
                      {new Date(selectedSession.sessionDate).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#613399]" />
                      {selectedSession.startTime} &mdash; {selectedSession.endTime} (UTC+1)
                    </span>
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Seats Booked:</span>
                  <Badge variant="outline" className="font-mono bg-white font-bold text-[#231651]">
                    {selectedSession.bookedSeatsCount} / {selectedSession.maxCapacity}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            {/* Attendance Metrics Bar */}
            <CardContent className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white">
              <div className="p-3 rounded-lg border border-border/60 bg-slate-50 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Enrolled Students
                </span>
                <p className="text-2xl font-extrabold text-[#231651] mt-1">{summary.totalEnrolled}</p>
              </div>

              <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/60 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Present
                </span>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">{summary.presentCount}</p>
              </div>

              <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/60 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Late
                </span>
                <p className="text-2xl font-extrabold text-amber-700 mt-1">{summary.lateCount}</p>
              </div>

              <div className="p-3 rounded-lg border border-rose-100 bg-rose-50/60 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  Absent
                </span>
                <p className="text-2xl font-extrabold text-rose-700 mt-1">{summary.absentCount}</p>
              </div>
            </CardContent>
          </Card>

          {/* Roster & Check-in Table */}
          <Card className="border-border/70 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base text-[#231651]">Cohort Student Roster</CardTitle>
                  <CardDescription className="text-xs">
                    One-click check-in. Attendance contributes to the 75% minimum physical practical requirement.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name..."
                    className="pl-8 text-xs bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingRoster ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Loading cohort roster...
                </div>
              ) : filteredRoster.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  {roster.length === 0
                    ? "No students enrolled in this cohort yet."
                    : "No students matching your search criteria."}
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredRoster.map((member) => {
                    const currentStatus = member.attendance?.attendanceStatus
                    const isSaving = updatingStudentId === member.studentId

                    return (
                      <div
                        key={member.studentId}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#E8E3F5] text-[#231651] font-bold flex items-center justify-center text-sm shrink-0">
                            {member.studentName?.charAt(0) || "S"}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#231651]">{member.studentName}</p>
                            <p className="text-xs text-muted-foreground">{member.studentEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {currentStatus && (
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize font-semibold mr-2 ${
                                currentStatus === "present"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : currentStatus === "late"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {currentStatus}
                            </Badge>
                          )}

                          <Button
                            size="sm"
                            variant={currentStatus === "present" ? "default" : "outline"}
                            className={
                              currentStatus === "present"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                                : "text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs h-8 px-3"
                            }
                            disabled={isSaving}
                            onClick={() => handleMarkAttendance(member, "present")}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Present
                          </Button>

                          <Button
                            size="sm"
                            variant={currentStatus === "late" ? "default" : "outline"}
                            className={
                              currentStatus === "late"
                                ? "bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3"
                                : "text-amber-700 border-amber-300 hover:bg-amber-50 text-xs h-8 px-3"
                            }
                            disabled={isSaving}
                            onClick={() => handleMarkAttendance(member, "late")}
                          >
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Late
                          </Button>

                          <Button
                            size="sm"
                            variant={currentStatus === "absent" ? "default" : "outline"}
                            className={
                              currentStatus === "absent"
                                ? "bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 px-3"
                                : "text-rose-700 border-rose-300 hover:bg-rose-50 text-xs h-8 px-3"
                            }
                            disabled={isSaving}
                            onClick={() => handleMarkAttendance(member, "absent")}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
