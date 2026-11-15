"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Copy, Download, ExternalLink, Loader2, Printer, XCircle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { getAcademyName } from "@/lib/brand-config"
import { useCartStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

type PaymentWithDetails = {
  id: string
  reference: string
  amount: number
  currency: string
  status: string
  paymentMethod: string
  invoiceNumber?: string
  transactionId?: string
  gatewayMessage?: string
  gatewayStatus?: string
  gatewayChannel?: string
  createdAt: string | Date
  courses?: Array<{ id: string; title: string; slug?: string; thumbnail?: string }>
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reference = searchParams.get("reference")
  const trxref = searchParams.get("trxref")
  const paymentReference = reference || trxref
  const [payment, setPayment] = useState<PaymentWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [paystackMessage, setPaystackMessage] = useState("")
  const { clearCart } = useCartStore()
  const { toast } = useToast()

  useEffect(() => {
    if (!paymentReference) {
      router.push("/courses")
      return
    }

    const loadPayment = async () => {
      setLoading(true)
      try {
        const verifyRes = await fetch(`/api/payments/verify?reference=${encodeURIComponent(paymentReference)}`)
        const verifyData = await verifyRes.json()
        setPaystackMessage(verifyData.paystackMessage || "")

        const paymentRes = await fetch(
          `/api/payments?reference=${encodeURIComponent(paymentReference)}&includeDetails=true`,
        )
        const paymentData = await paymentRes.json()
        const foundPayment = (paymentData.payments || [])[0] || null
        setPayment(foundPayment)

        if (foundPayment && (foundPayment.status === "completed" || foundPayment.status === "success")) {
          clearCart()
        }
      } catch (error) {
        console.error("Failed to load payment:", error)
      } finally {
        setLoading(false)
      }
    }

    void loadPayment()
  }, [paymentReference, router, clearCart])

  const statusLabel = useMemo(() => {
    if (!payment) return "pending"
    if (payment.status === "completed" || payment.status === "success") return "success"
    if (payment.status === "failed") return "failed"
    return payment.status
  }, [payment])

  const receiptText = useMemo(() => {
    if (!payment) return ""
    const courses =
      payment.courses && payment.courses.length > 0
        ? payment.courses.map((course) => `- ${course.title}`).join("\n")
        : "- Course metadata unavailable"

    return [
      `${getAcademyName().toUpperCase()} - PAYMENT RECEIPT`,
      "====================================",
      "",
      "APP TRANSACTION DETAILS",
      `Reference: ${payment.reference}`,
      `Status: ${payment.status}`,
      `Amount: ${formatCurrency(payment.amount, payment.currency as any)}`,
      `Invoice Number: ${payment.invoiceNumber || "N/A"}`,
      `Payment Method: ${payment.paymentMethod}`,
      `App Created At: ${formatDate(payment.createdAt as any)}`,
      `Transaction ID: ${payment.transactionId || "N/A"}`,
      "",
      "PAYSTACK DETAILS",
      `Gateway Status: ${payment.gatewayStatus || "N/A"}`,
      `Gateway Message: ${paystackMessage || payment.gatewayMessage || "N/A"}`,
      `Channel: ${payment.gatewayChannel || "N/A"}`,
      "",
      "COURSES PURCHASED",
      courses,
      "",
      `Generated At: ${new Date().toISOString()}`,
    ].join("\n")
  }, [payment, paystackMessage])

  const handleCopyReceipt = async () => {
    if (!receiptText) return
    try {
      await navigator.clipboard.writeText(receiptText)
      toast({
        title: "Copied",
        description: "Transaction details copied to clipboard.",
      })
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy details. Try download instead.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadReceipt = () => {
    if (!receiptText || !payment) return
    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `skillup-receipt-${payment.reference}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Loading transaction details</h2>
            <p className="text-sm text-muted-foreground">Please wait while we confirm your Paystack transaction.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="p-10 text-center space-y-4">
            <h2 className="text-xl font-semibold">Transaction details unavailable</h2>
            <p className="text-sm text-muted-foreground">
              We could not load your transaction details yet. Check payment history.
            </p>
            <Button asChild>
              <Link href="/dashboard/payments">Go to Payments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isSuccess = statusLabel === "success"

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full">
        <CardContent className="p-10">
          <div className="mb-8 text-center">
            <div
              className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                isSuccess ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {isSuccess ? (
                <CheckCircle className="h-12 w-12 text-green-600" />
              ) : (
                <XCircle className="h-12 w-12 text-red-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold">{isSuccess ? "Payment Successful" : "Payment Failed"}</h1>
            <p className="mt-2 text-muted-foreground">
              {isSuccess
                ? "Your transaction was processed and your course access has been updated."
                : "Your transaction did not complete successfully. Review the details below."}
            </p>
          </div>

          <div className="mb-8 rounded-lg border bg-muted/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Transaction Summary</h2>
              <Badge variant={isSuccess ? "default" : "destructive"}>{payment.status}</Badge>
            </div>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="flex justify-between gap-3 rounded border bg-background p-3">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono">{payment.reference}</span>
              </div>
              <div className="flex justify-between gap-3 rounded border bg-background p-3">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{formatCurrency(payment.amount, payment.currency as any)}</span>
              </div>
              <div className="flex justify-between gap-3 rounded border bg-background p-3">
                <span className="text-muted-foreground">Invoice</span>
                <span>{payment.invoiceNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between gap-3 rounded border bg-background p-3">
                <span className="text-muted-foreground">Transaction ID</span>
                <span>{payment.transactionId || "N/A"}</span>
              </div>
              <div className="flex justify-between gap-3 rounded border bg-background p-3">
                <span className="text-muted-foreground">Date</span>
                <span>{formatDate(payment.createdAt as any)}</span>
              </div>
              <div className="flex justify-between gap-3 rounded border bg-background p-3">
                <span className="text-muted-foreground">Payment Method</span>
                <span>{payment.paymentMethod}</span>
              </div>
              <div className="flex justify-between gap-3 rounded border bg-background p-3">
                <span className="text-muted-foreground">Paystack Status</span>
                <span>{payment.gatewayStatus || "N/A"}</span>
              </div>
              <div className="flex justify-between gap-3 rounded border bg-background p-3">
                <span className="text-muted-foreground">Paystack Channel</span>
                <span>{payment.gatewayChannel || "N/A"}</span>
              </div>
              <div className="flex justify-between gap-3 rounded border bg-background p-3 md:col-span-2">
                <span className="text-muted-foreground">Paystack Message</span>
                <span className="text-right">{paystackMessage || payment.gatewayMessage || "No message received."}</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-3 font-semibold">Courses in This Transaction</h3>
            <div className="space-y-2">
              {payment.courses && payment.courses.length > 0 ? (
                payment.courses.map((course) => (
                  <Link
                    key={course.id}
                    href={course.slug ? `/courses/${course.slug}` : "/courses"}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={course.thumbnail || "/placeholder.svg"}
                        alt={course.title}
                        className="h-12 w-16 rounded object-cover"
                      />
                      <span className="truncate font-medium">{course.title}</span>
                    </div>
                    <span className="flex items-center text-sm text-primary">
                      Open
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No course metadata found for this transaction.</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <Button variant="outline" onClick={handleCopyReceipt}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Details
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadReceipt}>
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" />
              Save PDF
            </Button>
            <Button asChild>
              <Link href={payment.reference ? `/dashboard/payments/${payment.reference}` : "/dashboard/payments"}>
                View Transaction
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">Loading transaction result...</CardContent>
          </Card>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  )
}
