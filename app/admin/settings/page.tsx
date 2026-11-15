"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, Bell, Mail, Shield, Video } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/store"
import { getAcademyName, DEFAULT_ACADEMY_DESCRIPTION } from "@/lib/brand-config"

type AdminSettings = {
  siteName: string
  siteDescription: string
  contactEmail: string
  supportEmail: string
  emailNotifications: boolean
  courseApproval: boolean
  autoEnrollment: boolean
  certificateGeneration: boolean
  maintenanceMode: boolean
  homeIntroVideoUrl: string
}

const DEFAULT_SETTINGS: AdminSettings = {
  siteName: getAcademyName(),
  siteDescription: DEFAULT_ACADEMY_DESCRIPTION,
  contactEmail: "admissions@techacademy.edu",
  supportEmail: "support@techacademy.edu",
  emailNotifications: true,
  courseApproval: false,
  autoEnrollment: true,
  certificateGeneration: true,
  maintenanceMode: false,
  homeIntroVideoUrl: "",
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const { token } = useAuthStore()
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/admin/settings", {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        })
        const data = await res.json()
        if (!res.ok || !data.settings) {
          throw new Error(data.error || "Failed to load settings")
        }
        setSettings(data.settings)
      } catch (error: any) {
        toast({
          title: "Settings load failed",
          description: error.message || "Using default settings values.",
          variant: "destructive",
        })
        setSettings(DEFAULT_SETTINGS)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadSettings()
    } else {
      setLoading(false)
    }
  }, [token, toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok || !data.settings) {
        throw new Error(data.error || "Failed to save settings")
      }
      setSettings(data.settings)
      toast({
        title: "Settings saved",
        description: "Your changes have been saved successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Could not save settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">Settings</h1>
          <p className="text-muted-foreground mt-2">Configure your {getAcademyName()} platform settings</p>
      </div>

      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Temporarily pause learner-facing access.</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Feature Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send email notifications to students.</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="courseApproval">Course Approval</Label>
                <p className="text-sm text-muted-foreground">Require admin approval for new courses.</p>
              </div>
              <Switch
                id="courseApproval"
                checked={settings.courseApproval}
                onCheckedChange={(checked) => setSettings({ ...settings, courseApproval: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoEnrollment">Auto Enrollment</Label>
                <p className="text-sm text-muted-foreground">Automatically enroll students after payment.</p>
              </div>
              <Switch
                id="autoEnrollment"
                checked={settings.autoEnrollment}
                onCheckedChange={(checked) => setSettings({ ...settings, autoEnrollment: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="certificateGeneration">Certificate Generation</Label>
                <p className="text-sm text-muted-foreground">Generate certificates upon course completion.</p>
              </div>
              <Switch
                id="certificateGeneration"
                checked={settings.certificateGeneration}
                onCheckedChange={(checked) => setSettings({ ...settings, certificateGeneration: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Homepage Intro Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="homeIntroVideoUrl">YouTube Video Link</Label>
              <Input
                id="homeIntroVideoUrl"
                value={settings.homeIntroVideoUrl}
                onChange={(e) => setSettings({ ...settings, homeIntroVideoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-sm text-muted-foreground">
                Paste a public or unlisted YouTube link. This video stays hidden until a valid YouTube URL is saved, then it appears in the homepage intro video section.
              </p>
              {settings.homeIntroVideoUrl.trim() ? (
                <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  Intro video is configured. Save changes, then refresh the homepage to confirm the player appears.
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                  No homepage video is configured yet, so the section remains hidden on the public home page.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}






