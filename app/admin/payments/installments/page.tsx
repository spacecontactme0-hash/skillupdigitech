"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CreditCard, DollarSign, AlertCircle, CheckCircle2, Clock, Mail, Search, ArrowLeft, Filter, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/store"

interface InstallmentRecord {
  enrolmentId: string
  studentId: string
  studentName: string
  studentEmail: string
  studentPhone?: string | null
  programmeName: string
  deliveryArrangement: string
  tuitionFeeNgn: number
  totalPaidNgn: number
  balanceNgn: number
  paymentPlan: string
  installmentStatus: "fully_paid" | "deposit_paid" | "overdue"
  dueDate: string
  isOverdue: boolean
  paymentCount: number
}

export default function AdminInstallmentsPage() {
  const { toast } = useToast()
  const { token } = useAuthStore()
  const [records, setRecords] = useState<InstallmentRecord[]>([])
  const [summary, setSummary] = useState({
    totalInstallmentRevenue: 0,
    totalOutstandingReceivables: 0,
    overdueCount: 0,
    totalStudents: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/installments", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load installments")

      setRecords(data.records || [])
      setSummary(data.summary || {
        totalInstallmentRevenue: 0,
        totalOutstandingReceivables: 0,
        overdueCount: 0,
        totalStudents: 0,
      })
    } catch (err: any) {
      toast({
        title: "Failed to load installment records",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      void loadData()
    }
  }, [token])

  const handleSendReminder = async (record: InstallmentRecord) => {
    setSendingReminderId(record.enrolmentId)
    try {
      const res = await fetch("/api/admin/installments", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          studentEmail: record.studentEmail,
          studentName: record.studentName,
          programmeName: record.programmeName,
          installmentAmountNgn: record.balanceNgn,
          dueDate: record.dueDate,
          isOverdue: record.isOverdue,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send reminder")

      toast({
        title: "Brevo Reminder Dispatched",
        description: `Installment reminder successfully sent to ${record.studentEmail}.`,
      })
    } catch (err: any) {
      toast({
        title: "Dispatch Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSendingReminderId(null)
    }
  }

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.programmeName?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || r.installmentStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
              <Link href="/admin/payments">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Payments Overview
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#231651] tracking-tight">
              Tuition Installment Tracking
            </h1>
            <Badge className="bg-[#D6FFF6] text-[#0A5C4A] hover:bg-[#D6FFF6] border-none font-semibold">
              Finance & Accounts
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track multi-enrolment tuition schedules, part-payment balances, and trigger automated Brevo reminders.
          </p>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 shadow-sm bg-white">
          <CardContent className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Installment Revenue
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#231651] mt-1">
              ₦{summary.totalInstallmentRevenue.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Total tuition collected</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm bg-white">
          <CardContent className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Outstanding Receivables
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-1">
              ₦{summary.totalOutstandingReceivables.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Pending student balances</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm bg-white">
          <CardContent className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Overdue Installments
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-700 mt-1">
              {summary.overdueCount}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Exceeded 30-day term</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm bg-white">
          <CardContent className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Programme Learners
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#231651] mt-1">
              {summary.totalStudents}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Active programme enrolments</p>
          </CardContent>
        </Card>
      </div>

      {/* Roster & Installments Table */}
      <Card className="border-border/70 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base text-[#231651]">Student Installment Accounts</CardTitle>
              <CardDescription className="text-xs">
                Real-time tracking of tuition payments and balance deadlines.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search student or email..."
                  className="pl-8 text-xs bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 text-xs bg-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="deposit_paid">Deposit Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="fully_paid">Fully Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading installment accounts...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No installment accounts found matching your filters.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredRecords.map((record) => {
                const isSending = sendingReminderId === record.enrolmentId

                return (
                  <div
                    key={record.enrolmentId}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#231651]">{record.studentName}</span>
                        <Badge
                          className={`text-[10px] font-semibold border-none ${
                            record.installmentStatus === "fully_paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : record.installmentStatus === "overdue"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {record.installmentStatus === "fully_paid"
                            ? "Fully Paid"
                            : record.installmentStatus === "overdue"
                            ? "Installment Overdue"
                            : "Deposit Paid (50%)"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>{record.studentEmail}</span>
                        {record.studentPhone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {record.studentPhone}
                          </span>
                        )}
                        <span className="text-[#613399] font-medium">&bull; {record.programmeName}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 self-start md:self-auto">
                      <div className="text-left sm:text-right space-y-0.5 text-xs">
                        <span className="text-muted-foreground block text-[11px]">Paid vs Balance</span>
                        <p className="font-bold text-[#231651]">
                          ₦{record.totalPaidNgn.toLocaleString()}{" "}
                          <span className="text-muted-foreground font-normal">/ ₦{record.tuitionFeeNgn.toLocaleString()}</span>
                        </p>
                        {record.balanceNgn > 0 ? (
                          <p className="text-[11px] font-semibold text-rose-600">
                            ₦{record.balanceNgn.toLocaleString()} balance due
                          </p>
                        ) : (
                          <p className="text-[11px] font-semibold text-emerald-600">No balance remaining</p>
                        )}
                      </div>

                      {record.balanceNgn > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white border-[#231651]/30 text-[#231651] hover:bg-[#E8E3F5]/40 text-xs h-8"
                          disabled={isSending}
                          onClick={() => handleSendReminder(record)}
                        >
                          <Mail className="w-3.5 h-3.5 mr-1.5" />
                          {isSending ? "Sending..." : "Send Reminder"}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold px-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Cleared
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
