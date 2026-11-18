"use client"

import { useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Mail,
  Send,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/lib/store"

interface WriteToInstructorModalProps {
  isOpen: boolean
  onClose: () => void
  defaultCourseId?: string
  courseTitle?: string
}

export function WriteToInstructorModal({
  isOpen,
  onClose,
  defaultCourseId,
  courseTitle,
}: WriteToInstructorModalProps) {
  const { token } = useAuthStore()
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState<
    "technical_concept" | "assignment_feedback" | "capstone_project" | "schedule_attendance" | "general_inquiry"
  >("technical_concept")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState<"normal" | "urgent">("normal")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      setError("Please fill in both the subject and your message.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/student/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          courseId: defaultCourseId,
          subject: subject.trim(),
          category,
          message: message.trim(),
          priority,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message.")
      }

      setSuccess(true)
      setSuccessMessage(
        data.message ||
          "Your inquiry has been delivered to your faculty instructor. You will receive an update in your dashboard and email.",
      )
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetAndClose = () => {
    setSubject("")
    setMessage("")
    setError(null)
    setSuccess(false)
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleResetAndClose()}>
      <DialogContent className="sm:max-w-xl rounded-3xl border border-[#E8E3F5] bg-white p-6 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#231651]">
            <Mail className="w-4 h-4 text-[#613399]" />
            Direct Faculty Communication
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-[#231651]">
            Write to Your Instructor
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {courseTitle ? (
              <span>
                Regarding your progress in <strong className="text-slate-700">{courseTitle}</strong>.
              </span>
            ) : (
              "Ask a technical question, request assignment feedback, or consult on your capstone project."
            )}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-[#231651]">Message Delivered!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">{successMessage}</p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Sparkles className="w-3.5 h-3.5 inline mr-1 text-[#613399]" />
              <strong>Expected response:</strong> Within 24 business hours. Feedback will appear in your learning timeline.
            </div>
            <Button
              onClick={handleResetAndClose}
              className="mt-4 bg-[#231651] hover:bg-[#150C33] text-[#D6FFF6] font-bold rounded-xl px-8"
            >
              Return to Dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                Inquiry Topic
              </Label>
              <Select
                value={category}
                onValueChange={(val: any) => setCategory(val)}
              >
                <SelectTrigger id="category" className="rounded-xl bg-slate-50/50">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical_concept">Technical Concept / Code Walkthrough</SelectItem>
                  <SelectItem value="assignment_feedback">Assignment / Code Review Feedback</SelectItem>
                  <SelectItem value="capstone_project">Capstone Project Architecture & Guidance</SelectItem>
                  <SelectItem value="schedule_attendance">Timetable & Attendance Query</SelectItem>
                  <SelectItem value="general_inquiry">General Academic Question</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-semibold text-slate-700">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Question on Vector Indexing in Module 4"
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="message" className="text-xs font-semibold text-slate-700">
                  Message / Question Body
                </Label>
                <span className="text-[11px] text-slate-400">Be specific with code snippets or error logs</span>
              </div>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain what you are trying to solve, what you tried, and where you got stuck..."
                rows={5}
                className="rounded-xl text-xs leading-relaxed"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="priority" className="text-xs font-semibold text-slate-700">
                  Priority:
                </Label>
                <Select
                  value={priority}
                  onValueChange={(val: any) => setPriority(val)}
                >
                  <SelectTrigger id="priority" className="h-8 rounded-lg text-xs w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Moderated for student safety
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetAndClose}
                disabled={loading}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#231651] hover:bg-[#150C33] text-[#D6FFF6] font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending Inquiry...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send to Instructor
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
