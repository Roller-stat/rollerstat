"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Mail, RefreshCw, Search, Send, Users } from "lucide-react"
import { toast } from "sonner"

type CampaignStatus = "suspended" | "archive" | "sent" | "queued" | "draft" | "inProcess"

interface NewsletterStats {
  newsletterListId: number
  totalSubscribers: number
  uniqueSubscribers: number
  blacklistedSubscribers: number
  campaigns: {
    total: number
    last30Days: number
    sent: number
    scheduled: number
    draft: number
    queued: number
    inProcess: number
  }
}

interface Subscriber {
  id: number
  email: string
  firstName: string
  lastName: string
  locale: string
  createdAt: string
  modifiedAt: string
  emailBlacklisted: boolean
}

interface Campaign {
  id: number
  name: string
  subject: string
  status: CampaignStatus
  scheduledAt: string | null
  sentDate: string | null
  createdAt: string
  modifiedAt: string
  recipients: number
  openRate: number | null
  clickRate: number | null
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function statusBadgeVariant(status: CampaignStatus): "default" | "secondary" | "outline" {
  if (status === "sent") return "default"
  if (status === "queued" || status === "inProcess") return "secondary"
  return "outline"
}

export default function NewsletterPage() {
  const { status } = useSession()

  const [stats, setStats] = useState<NewsletterStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const [subscriberQuery, setSubscriberQuery] = useState("")
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [subscribersLoading, setSubscribersLoading] = useState(true)
  const [subscriberPage, setSubscriberPage] = useState(1)
  const [subscriberPageSize] = useState(20)
  const [subscriberTotal, setSubscriberTotal] = useState(0)
  const [subscriberTotalPages, setSubscriberTotalPages] = useState(1)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<"all" | CampaignStatus>("all")
  const [campaignPage, setCampaignPage] = useState(1)
  const [campaignPageSize] = useState(10)
  const [campaignTotal, setCampaignTotal] = useState(0)
  const [campaignTotalPages, setCampaignTotalPages] = useState(1)

  const [subject, setSubject] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [htmlContent, setHtmlContent] = useState("")
  const [scheduleAt, setScheduleAt] = useState("")
  const [submittingCampaign, setSubmittingCampaign] = useState(false)

  const canSubmitCampaign = useMemo(() => {
    return subject.trim().length >= 3 && htmlContent.trim().length >= 20 && !submittingCampaign
  }, [subject, htmlContent, submittingCampaign])

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const response = await fetch("/api/admin/newsletter/stats", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load newsletter stats")
      }
      setStats(payload as NewsletterStats)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load newsletter stats")
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchSubscribers = useCallback(async () => {
    try {
      setSubscribersLoading(true)
      const params = new URLSearchParams()
      params.set("page", String(subscriberPage))
      params.set("pageSize", String(subscriberPageSize))
      if (subscriberQuery.trim()) {
        params.set("q", subscriberQuery.trim())
      }

      const response = await fetch(`/api/admin/newsletter/subscribers?${params.toString()}`, {
        cache: "no-store",
      })
      const payload = (await response.json()) as PaginatedResponse<Subscriber> & { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load subscribers")
      }

      setSubscribers(payload.items || [])
      setSubscriberTotal(payload.total || 0)
      setSubscriberTotalPages(payload.totalPages || 1)
      setSubscriberPage(payload.page || 1)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load subscribers")
    } finally {
      setSubscribersLoading(false)
    }
  }, [subscriberPage, subscriberPageSize, subscriberQuery])

  const fetchCampaigns = useCallback(async () => {
    try {
      setCampaignsLoading(true)
      const params = new URLSearchParams()
      params.set("page", String(campaignPage))
      params.set("pageSize", String(campaignPageSize))
      if (campaignStatusFilter !== "all") {
        params.set("status", campaignStatusFilter)
      }

      const response = await fetch(`/api/admin/newsletter/campaigns?${params.toString()}`, {
        cache: "no-store",
      })
      const payload = (await response.json()) as PaginatedResponse<Campaign> & { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load campaigns")
      }

      setCampaigns(payload.items || [])
      setCampaignTotal(payload.total || 0)
      setCampaignTotalPages(payload.totalPages || 1)
      setCampaignPage(payload.page || 1)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load campaigns")
    } finally {
      setCampaignsLoading(false)
    }
  }, [campaignPage, campaignPageSize, campaignStatusFilter])

  useEffect(() => {
    if (status !== "authenticated") {
      setStatsLoading(false)
      setSubscribersLoading(false)
      setCampaignsLoading(false)
      return
    }

    void fetchStats()
  }, [status, fetchStats])

  useEffect(() => {
    if (status === "authenticated") {
      void fetchSubscribers()
    }
  }, [status, fetchSubscribers])

  useEffect(() => {
    if (status === "authenticated") {
      void fetchCampaigns()
    }
  }, [status, fetchCampaigns])

  const handleCreateCampaign = async () => {
    try {
      setSubmittingCampaign(true)

      const response = await fetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subject.trim(),
          previewText: previewText.trim() || undefined,
          htmlContent,
          scheduleAt: scheduleAt || undefined,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "Failed to create campaign")
      }

      toast.success(payload.message || "Campaign created")
      setSubject("")
      setPreviewText("")
      setHtmlContent("")
      setScheduleAt("")
      void Promise.all([fetchCampaigns(), fetchStats()])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create campaign")
    } finally {
      setSubmittingCampaign(false)
    }
  }

  const breadcrumbs = [{ label: "Newsletter" }]

  return (
    <AuthGuard>
      <AdminLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Newsletter</h1>
              <p className="mt-2 text-muted-foreground">Manage subscribers and send campaigns with Brevo.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                void Promise.all([fetchStats(), fetchSubscribers(), fetchCampaigns()])
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {statsLoading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalSubscribers || 0}</div>
                    <p className="text-xs text-muted-foreground">In newsletter list</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Unique Contacts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.uniqueSubscribers || 0}</div>
                    <p className="text-xs text-muted-foreground">List-level unique count</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Campaigns (30d)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.campaigns.last30Days || 0}</div>
                    <p className="text-xs text-muted-foreground">Recent campaign activity</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">List ID</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.newsletterListId || "-"}</div>
                    <p className="text-xs text-muted-foreground">Brevo newsletter list</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Compose Campaign
                </CardTitle>
                <CardDescription>Create and send/schedule a campaign to your newsletter list.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
                <Input
                  placeholder="Preview text (optional)"
                  value={previewText}
                  onChange={(event) => setPreviewText(event.target.value)}
                />
                <Textarea
                  placeholder="HTML content"
                  className="min-h-[220px] font-mono text-xs"
                  value={htmlContent}
                  onChange={(event) => setHtmlContent(event.target.value)}
                />
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Schedule at (optional)</label>
                  <Input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(event) => setScheduleAt(event.target.value)}
                  />
                </div>
                <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Leave schedule empty to send immediately.
                </div>
                <Button
                  onClick={handleCreateCampaign}
                  disabled={!canSubmitCampaign}
                  className="w-full"
                >
                  {submittingCampaign ? "Submitting..." : scheduleAt ? "Schedule Campaign" : "Send Campaign Now"}
                </Button>
              </CardContent>
            </Card>

            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Subscribers ({subscriberTotal})
                </CardTitle>
                <CardDescription>Search and review newsletter subscribers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={subscriberQuery}
                    onChange={(event) => {
                      setSubscriberQuery(event.target.value)
                      setSubscriberPage(1)
                    }}
                    className="pl-10"
                    placeholder="Search email or name"
                  />
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Locale</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribersLoading ? (
                        <TableRow>
                          <TableCell colSpan={4}>Loading subscribers...</TableCell>
                        </TableRow>
                      ) : subscribers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4}>No subscribers found.</TableCell>
                        </TableRow>
                      ) : (
                        subscribers.map((subscriber) => (
                          <TableRow key={subscriber.id}>
                            <TableCell className="font-medium">{subscriber.email}</TableCell>
                            <TableCell>{`${subscriber.firstName} ${subscriber.lastName}`.trim() || "-"}</TableCell>
                            <TableCell>{subscriber.locale.toUpperCase()}</TableCell>
                            <TableCell>{new Date(subscriber.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {subscriberTotal === 0
                      ? "0 subscribers"
                      : `${(subscriberPage - 1) * subscriberPageSize + 1}-${Math.min(
                          subscriberPage * subscriberPageSize,
                          subscriberTotal,
                        )} of ${subscriberTotal}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubscriberPage((current) => Math.max(1, current - 1))}
                      disabled={subscriberPage <= 1}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubscriberPage((current) => Math.min(subscriberTotalPages, current + 1))}
                      disabled={subscriberPage >= subscriberTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Campaign History ({campaignTotal})
                </CardTitle>
                <CardDescription>Recent newsletter campaign status and performance.</CardDescription>
              </div>
              <Select
                value={campaignStatusFilter}
                onValueChange={(value: "all" | CampaignStatus) => {
                  setCampaignStatusFilter(value)
                  setCampaignPage(1)
                }}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="inProcess">In process</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="archive">Archived</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Schedule / Sent</TableHead>
                      <TableHead>Open Rate</TableHead>
                      <TableHead>Click Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6}>Loading campaigns...</TableCell>
                      </TableRow>
                    ) : campaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>No campaigns found.</TableCell>
                      </TableRow>
                    ) : (
                      campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(campaign.status)}>{campaign.status}</Badge>
                          </TableCell>
                          <TableCell>{campaign.subject || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {campaign.sentDate
                                ? new Date(campaign.sentDate).toLocaleString()
                                : campaign.scheduledAt
                                  ? new Date(campaign.scheduledAt).toLocaleString()
                                  : "-"}
                            </div>
                          </TableCell>
                          <TableCell>{campaign.openRate !== null ? `${campaign.openRate}%` : "-"}</TableCell>
                          <TableCell>{campaign.clickRate !== null ? `${campaign.clickRate}%` : "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>
                  {campaignTotal === 0
                    ? "0 campaigns"
                    : `${(campaignPage - 1) * campaignPageSize + 1}-${Math.min(
                        campaignPage * campaignPageSize,
                        campaignTotal,
                      )} of ${campaignTotal}`}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCampaignPage((current) => Math.max(1, current - 1))}
                    disabled={campaignPage <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCampaignPage((current) => Math.min(campaignTotalPages, current + 1))}
                    disabled={campaignPage >= campaignTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
