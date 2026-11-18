"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  RotateCcw,
  Search,
  XCircle,
  Loader2,
} from "lucide-react"
import type { Payment } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/format"
import { AdminActionDialog } from "@/components/admin/AdminActionDialog"
import { AdminStatRow } from "@/components/admin/AdminStatRow"
import { AdminFilterBar } from "@/components/admin/AdminFilterBar"

export default function AdminPaymentsPage() {
  type EnrichedPayment = Payment & {
    courses?: Array<{ id: string; title: string }>
    user?: { id: string; name: string; email: string; role: string }
  }

  const [payments, setPayments] = useState<EnrichedPayment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<EnrichedPayment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currencyFilter, setCurrencyFilter] = useState<string>("all")
  const [reviewFilter, setReviewFilter] = useState<string>("all")
  const [refundTarget, setRefundTarget] = useState<EnrichedPayment | null>(null)
  const [pendingRefundId, setPendingRefundId] = useState<string | null>(null)

  useEffect(() => {
    loadPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchQuery, statusFilter, currencyFilter, reviewFilter])

  const loadPayments = async () => {
    try {
      const res = await fetch("/api/payments?includeDetails=true")
      const data = await res.json()
      const allPayments: EnrichedPayment[] = data.payments || []
      setPayments(allPayments)
    } catch (error) {
      console.error("Error loading payments:", error)
    }
  }

  const getCustomerLabel = (payment: EnrichedPayment) => {
    if (payment.user) {
      return {
        title: payment.user.name,
        subtitle: payment.user.email,
      }
    }

    if (payment.customerEmail) {
      return {
        title: "Pending verification",
        subtitle: payment.customerEmail,
      }
    }

    return {
      title: payment.userId,
      subtitle: "",
    }
  }

  const filterPayments = () => {
    let filtered = [...payments]

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.manualReviewReason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.manualReviewSource?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.fraudReason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.courses?.some((course) => course.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => {
        if (statusFilter === "completed") {
          return p.status === "completed" || p.status === "success"
        }
        return p.status === statusFilter
      })
    }

    if (currencyFilter !== "all") {
      filtered = filtered.filter((p) => p.currency === currencyFilter)
    }

    if (reviewFilter === "manual_review") {
      filtered = filtered.filter((p) => p.status === "manual_review")
    } else if (reviewFilter === "fraud_flagged") {
      filtered = filtered.filter((p) => Boolean(p.fraudFlagged))
    } else if (reviewFilter === "needs_attention") {
      filtered = filtered.filter((p) => p.status === "manual_review" || Boolean(p.fraudFlagged))
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    setFilteredPayments(filtered)
  }

  const totals = useMemo(() => {
    const completed = payments.filter((p) => p.status === "completed" || p.status === "success")
    const pending = payments.filter((p) => p.status === "pending")
    const failed = payments.filter((p) => p.status === "failed")
    const refunded = payments.filter((p) => p.status === "refunded")
    const manualReview = payments.filter((p) => p.status === "manual_review")
    const fraudFlagged = payments.filter((p) => Boolean(p.fraudFlagged))

    return {
      completed: completed.length,
      pending: pending.length,
      failed: failed.length,
      refunded: refunded.length,
      manualReview: manualReview.length,
      fraudFlagged: fraudFlagged.length,
      total: payments.length,
    }
  }, [payments])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "manual_review":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "refunded":
        return <RotateCcw className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return <Badge className="bg-green-500">Completed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "manual_review":
        return <Badge className="bg-amber-500">Manual Review</Badge>
      case "refunded":
        return <Badge className="bg-blue-500">Refunded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleRefund = async (payment: EnrichedPayment, refundReason?: string) => {
    setPendingRefundId(payment.id)
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "refunded", refundReason }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Refund failed")
      }
      const data = await res.json()
      setPayments((prev) => prev.map((p) => (p.id === payment.id ? data.payment : p)))
    } catch (error) {
      console.error("Refund failed:", error)
      throw error
    } finally {
      setPendingRefundId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#231651]">Payment Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Review transaction histories, manage student installments, and handle refunds</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="bg-[#231651] hover:bg-[#150C33] text-white text-xs">
            <Link href="/admin/payments/installments">
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Tuition Installments
            </Link>
          </Button>
          <Button asChild variant="outline" className="text-xs">
            <Link href="/admin/payments/verify">Manual Verify</Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <AdminStatRow
          items={[
            { key: "total", label: "Total Payments", value: totals.total, icon: CreditCard },
            { key: "completed", label: "Completed", value: totals.completed, icon: CheckCircle2 },
            { key: "pending", label: "Pending", value: totals.pending, icon: Clock },
            { key: "manual-review", label: "Manual Review", value: totals.manualReview, icon: Clock },
            { key: "fraud-flagged", label: "Fraud Flagged", value: totals.fraudFlagged, icon: XCircle },
            { key: "refunded", label: "Refunded", value: totals.refunded, icon: RotateCcw },
          ]}
        />
      </div>

      <div className="mb-6">
        <AdminFilterBar
          title="Filters"
          description="Search by reference, customer, course, and filter by status/currency."
          onClear={() => {
            setSearchQuery("")
            setStatusFilter("all")
            setCurrencyFilter("all")
            setReviewFilter("all")
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="NGN">NGN</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reviewFilter} onValueChange={setReviewFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Review state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Review States</SelectItem>
                <SelectItem value="needs_attention">Needs Attention</SelectItem>
                <SelectItem value="manual_review">Manual Review</SelectItem>
                <SelectItem value="fraud_flagged">Fraud Flagged</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center text-xs text-muted-foreground">
              URL-synced filters planned in next pass.
            </div>
          </div>
        </AdminFilterBar>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payments</CardTitle>
              <CardDescription>
                Showing {filteredPayments.length} of {payments.length} payments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Reference</th>
                    <th className="text-left p-3 font-semibold">Customer</th>
                    <th className="text-left p-3 font-semibold">Courses</th>
                    <th className="text-left p-3 font-semibold">Amount</th>
                    <th className="text-left p-3 font-semibold">Currency</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Review</th>
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const customer = getCustomerLabel(payment)

                    return (
                      <tr key={payment.id} className="border-b hover:bg-accent/50 transition-colors">
                        <td className="p-3">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {payment.reference}
                          </code>
                        </td>
                        <td className="p-3 font-medium">
                          <div>
                            <p>{customer.title}</p>
                            {customer.subtitle ? <p className="text-xs text-muted-foreground">{customer.subtitle}</p> : null}
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="line-clamp-2 text-xs">
                            {payment.courses?.length ? payment.courses.map((c) => c.title).join(", ") : payment.courseId}
                          </p>
                        </td>
                        <td className="p-3 font-semibold">
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{payment.currency}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.status)}
                            {getStatusBadge(payment.status)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {!payment.user && payment.customerEmail ? (
                              <Badge variant="secondary" className="text-xs">Pending Registration</Badge>
                            ) : null}
                            {payment.fraudFlagged ? (
                              <Badge variant="destructive" className="text-xs">Fraud Flagged</Badge>
                            ) : null}
                            {payment.manualReviewSource ? (
                              <Badge variant="outline" className="text-xs">
                                {payment.manualReviewSource}
                              </Badge>
                            ) : null}
                            {payment.manualReviewReason ? (
                              <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                                {payment.manualReviewReason}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {(payment.status === "completed" || payment.status === "success") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRefundTarget(payment)}
                                disabled={pendingRefundId === payment.id}
                              >
                                {pendingRefundId === payment.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Refunding...
                                  </>
                                ) : (
                                  "Refund"
                                )}
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/payments/${payment.reference}`}>View Transaction</Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AdminActionDialog
        open={Boolean(refundTarget)}
        onOpenChange={(open) => {
          if (!open) setRefundTarget(null)
        }}
        title="Refund payment"
        description={
          refundTarget
            ? `Refund ${formatCurrency(refundTarget.amount, refundTarget.currency)} for reference ${refundTarget.reference}.`
            : "Refund selected payment."
        }
        warningBadge="Destructive Action"
        secondaryDescription="Refund operations should include an internal reason for audit."
        noteLabel="Refund reason"
        notePlaceholder="Write a short reason for this refund..."
        noteRequired
        confirmLabel="Confirm Refund"
        successToast="Payment refunded successfully."
        errorToast="Refund failed."
        executeAction={async (note) => {
          if (!refundTarget) return
          await handleRefund(refundTarget, note)
        }}
      />
    </div>
  )
}
