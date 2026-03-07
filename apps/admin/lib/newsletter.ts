import * as brevo from "@getbrevo/brevo"

type CampaignStatus = "suspended" | "archive" | "sent" | "queued" | "draft" | "inProcess"

const contactsApi = new brevo.ContactsApi()
const campaignsApi = new brevo.EmailCampaignsApi()

const brevoApiKey = process.env.BREVO_API_KEY
if (brevoApiKey) {
  contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, brevoApiKey)
  campaignsApi.setApiKey(brevo.EmailCampaignsApiApiKeys.apiKey, brevoApiKey)
}

export interface NewsletterSubscriber {
  id: number
  email: string
  firstName: string
  lastName: string
  locale: string
  createdAt: string
  modifiedAt: string
  emailBlacklisted: boolean
}

export interface NewsletterCampaignSummary {
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

export interface NewsletterStats {
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

export interface CampaignCreateInput {
  name?: string
  subject: string
  previewText?: string
  htmlContent: string
  listId?: number
  scheduleAt?: string
  sendNow?: boolean
}

export interface CampaignCreateResult {
  success: boolean
  campaignId?: number
  status?: "scheduled" | "sent"
  error?: string
}

export interface PostNewsletterInput {
  title: string
  summary: string
  locale: "en" | "es" | "fr" | "it" | "pt"
  type: "news" | "blog"
  slug: string
  author: string
  coverImage?: string
  subject?: string
  previewText?: string
  scheduleAt?: string
  listId?: number
}

export interface ListSubscribersParams {
  page: number
  pageSize: number
  query?: string
}

export interface ListCampaignParams {
  page: number
  pageSize: number
  status?: CampaignStatus
}

function ensureBrevoConfigured() {
  if (!brevoApiKey) {
    throw new Error("BREVO_API_KEY is not configured")
  }
}

function resolveNewsletterListId(explicit?: number): number {
  const resolved = explicit || Number.parseInt(process.env.BREVO_NEWSLETTER_LIST_ID || "", 10)
  if (!Number.isFinite(resolved) || resolved <= 0) {
    throw new Error("BREVO_NEWSLETTER_LIST_ID is not configured correctly")
  }
  return resolved
}

function resolveSender() {
  const email = process.env.BREVO_SENDER_EMAIL
  if (!email) {
    throw new Error("BREVO_SENDER_EMAIL is not configured")
  }

  return {
    name: process.env.BREVO_SENDER_NAME || "Rollerstat",
    email,
  }
}

function resolveBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "")
}

function getPostPath(type: "news" | "blog"): "news" | "blogs" {
  return type === "blog" ? "blogs" : "news"
}

function toIsoDateTime(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid newsletter schedule time")
  }

  return parsed.toISOString()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function buildPostNewsletterHtml(input: PostNewsletterInput): string {
  const baseUrl = resolveBaseUrl()
  const postUrl = `${baseUrl}/${input.locale}/${getPostPath(input.type)}/${input.slug}`
  const escapedTitle = escapeHtml(input.title)
  const escapedSummary = escapeHtml(input.summary)
  const escapedAuthor = escapeHtml(input.author)

  const imageBlock = input.coverImage
    ? `<img src="${escapeHtml(input.coverImage)}" alt="${escapedTitle}" style="max-width: 100%; border-radius: 10px; margin-bottom: 16px;" />`
    : ""

  return `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827; line-height: 1.6;">
    ${imageBlock}
    <h1 style="font-size: 24px; margin: 0 0 12px 0;">${escapedTitle}</h1>
    <p style="font-size: 16px; margin: 0 0 18px 0;">${escapedSummary}</p>
    <p style="font-size: 14px; color: #6b7280; margin: 0 0 20px 0;">By ${escapedAuthor}</p>
    <a href="${postUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 8px; text-decoration: none; background: #0f172a; color: #ffffff; font-weight: 600;">
      Read Full Story
    </a>
    <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
      You’re receiving this because you subscribed to Rollerstat updates.
    </p>
  </div>
  `
}

function mapSubscriber(raw: {
  id: number
  email?: string
  attributes?: object
  createdAt: string
  modifiedAt: string
  emailBlacklisted: boolean
}): NewsletterSubscriber {
  const attributes = (raw.attributes || {}) as Record<string, unknown>
  return {
    id: raw.id,
    email: raw.email || "",
    firstName: String(attributes.firstName || ""),
    lastName: String(attributes.lastName || ""),
    locale: String(attributes.locale || "en"),
    createdAt: raw.createdAt,
    modifiedAt: raw.modifiedAt,
    emailBlacklisted: raw.emailBlacklisted,
  }
}

function mapCampaign(raw: {
  id: number
  name: string
  subject?: string
  status: string
  scheduledAt?: string
  sentDate?: string
  createdAt: string
  modifiedAt: string
  recipients: { listIds?: number[]; segmentIds?: number[] }
  statistics: { opened?: number; uniqueClicks?: number; delivered?: number }
}): NewsletterCampaignSummary {
  const delivered = raw.statistics?.delivered || 0
  const opened = raw.statistics?.opened || 0
  const uniqueClicks = raw.statistics?.uniqueClicks || 0

  return {
    id: raw.id,
    name: raw.name,
    subject: raw.subject || "",
    status: normalizeCampaignStatus(raw.status),
    scheduledAt: raw.scheduledAt || null,
    sentDate: raw.sentDate || null,
    createdAt: raw.createdAt,
    modifiedAt: raw.modifiedAt,
    recipients: (raw.recipients?.listIds || raw.recipients?.segmentIds || []).length,
    openRate: delivered > 0 ? Number(((opened / delivered) * 100).toFixed(2)) : null,
    clickRate: delivered > 0 ? Number(((uniqueClicks / delivered) * 100).toFixed(2)) : null,
  }
}

function normalizeCampaignStatus(status: string): CampaignStatus {
  if (
    status === "suspended" ||
    status === "archive" ||
    status === "sent" ||
    status === "queued" ||
    status === "draft" ||
    status === "inProcess"
  ) {
    return status
  }

  return "draft"
}

export async function listNewsletterSubscribers(
  params: ListSubscribersParams,
): Promise<{
  items: NewsletterSubscriber[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  ensureBrevoConfigured()
  const listId = resolveNewsletterListId()
  const pageSize = Math.min(100, Math.max(1, params.pageSize))
  const page = Math.max(1, params.page)
  const normalizedQuery = params.query?.trim().toLowerCase() || ""

  if (!normalizedQuery) {
    const offset = (page - 1) * pageSize
    const { body } = await contactsApi.getContactsFromList(listId, undefined, pageSize, offset, "desc")
    const contacts = (body.contacts || []).map(mapSubscriber)
    const total = typeof body.count === "number" ? body.count : contacts.length
    return {
      items: contacts,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    }
  }

  const aggregate: NewsletterSubscriber[] = []
  const batchSize = 200
  const hardLimit = 2000
  let offset = 0

  while (aggregate.length < hardLimit) {
    const { body } = await contactsApi.getContactsFromList(listId, undefined, batchSize, offset, "desc")
    const contacts = (body.contacts || []).map(mapSubscriber)
    if (contacts.length === 0) {
      break
    }

    aggregate.push(...contacts)
    offset += contacts.length

    if (contacts.length < batchSize) {
      break
    }
  }

  const filtered = aggregate.filter((subscriber) => {
    const haystack = `${subscriber.email} ${subscriber.firstName} ${subscriber.lastName} ${subscriber.locale}`.toLowerCase()
    return haystack.includes(normalizedQuery)
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const normalizedPage = Math.min(page, totalPages)
  const start = (normalizedPage - 1) * pageSize

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page: normalizedPage,
    pageSize,
    totalPages,
  }
}

export async function listNewsletterCampaigns(
  params: ListCampaignParams,
): Promise<{
  items: NewsletterCampaignSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  ensureBrevoConfigured()
  const pageSize = Math.min(100, Math.max(1, params.pageSize))
  const page = Math.max(1, params.page)
  const offset = (page - 1) * pageSize

  const { body } = await campaignsApi.getEmailCampaigns(
    "classic",
    params.status,
    "globalStats",
    undefined,
    undefined,
    pageSize,
    offset,
    "desc",
    true,
  )

  const items = (body.campaigns || []).map((campaign) =>
    mapCampaign(campaign as unknown as Parameters<typeof mapCampaign>[0]),
  )
  const total = typeof body.count === "number" ? body.count : items.length

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function getNewsletterStats(): Promise<NewsletterStats> {
  ensureBrevoConfigured()
  const newsletterListId = resolveNewsletterListId()

  const [{ body: listsBody }, { body: campaignsBody }] = await Promise.all([
    contactsApi.getLists(50, 0, "desc"),
    campaignsApi.getEmailCampaigns("classic", undefined, "globalStats", undefined, undefined, 100, 0, "desc", true),
  ])

  const lists = (listsBody.lists || []) as Array<{
    id?: number
    totalSubscribers?: number
    totalBlacklisted?: number
    uniqueSubscribers?: number
  }>

  const newsletterList = lists.find((list) => list.id === newsletterListId)
  const campaignsRaw = (campaignsBody.campaigns || []) as unknown as Array<{
    status?: string
    createdAt?: string
    scheduledAt?: string
  }>
  const campaigns = campaignsRaw.map((campaign) => ({
    status: normalizeCampaignStatus(String(campaign.status || "draft")),
    createdAt: campaign.createdAt || "",
    scheduledAt: campaign.scheduledAt,
  }))
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

  return {
    newsletterListId,
    totalSubscribers: newsletterList?.totalSubscribers || 0,
    uniqueSubscribers: newsletterList?.uniqueSubscribers || 0,
    blacklistedSubscribers: newsletterList?.totalBlacklisted || 0,
    campaigns: {
      total: campaigns.length,
      last30Days: campaigns.filter((campaign) => {
        const createdAt = new Date(campaign.createdAt).getTime()
        return Number.isFinite(createdAt) && createdAt >= thirtyDaysAgo
      }).length,
      sent: campaigns.filter((campaign) => campaign.status === "sent").length,
      scheduled: campaigns.filter((campaign) => Boolean(campaign.scheduledAt) && campaign.status !== "sent").length,
      draft: campaigns.filter((campaign) => campaign.status === "draft").length,
      queued: campaigns.filter((campaign) => campaign.status === "queued").length,
      inProcess: campaigns.filter((campaign) => campaign.status === "inProcess").length,
    },
  }
}

export async function createNewsletterCampaign(input: CampaignCreateInput): Promise<CampaignCreateResult> {
  try {
    ensureBrevoConfigured()
    const listId = resolveNewsletterListId(input.listId)
    const sender = resolveSender()
    const scheduleAtIso = toIsoDateTime(input.scheduleAt)

    const campaign = new brevo.CreateEmailCampaign()
    campaign.name = (input.name || input.subject).slice(0, 120)
    campaign.subject = input.subject
    campaign.previewText = input.previewText
    campaign.htmlContent = input.htmlContent
    campaign.sender = sender
    campaign.recipients = { listIds: [listId] }
    if (scheduleAtIso) {
      campaign.scheduledAt = scheduleAtIso
    }

    const createResult = await campaignsApi.createEmailCampaign(campaign)
    const campaignId = createResult.body?.id

    if (!campaignId || !Number.isFinite(campaignId)) {
      throw new Error("Failed to resolve created campaign id")
    }

    const shouldSendNow = input.sendNow !== false && !scheduleAtIso
    if (shouldSendNow) {
      await campaignsApi.sendEmailCampaignNow(campaignId)
      return { success: true, campaignId, status: "sent" }
    }

    return { success: true, campaignId, status: "scheduled" }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create newsletter campaign",
    }
  }
}

export async function createCampaignFromPublishedPost(input: PostNewsletterInput): Promise<CampaignCreateResult> {
  const defaultSubject = `${input.title} | Rollerstat`

  return createNewsletterCampaign({
    name: `Post: ${input.title}`.slice(0, 120),
    subject: input.subject?.trim() || defaultSubject,
    previewText: input.previewText?.trim() || input.summary.slice(0, 140),
    htmlContent: buildPostNewsletterHtml(input),
    scheduleAt: input.scheduleAt,
    listId: input.listId,
    sendNow: !input.scheduleAt,
  })
}

export function buildNewsletterHtmlFromPost(input: PostNewsletterInput): string {
  return buildPostNewsletterHtml(input)
}
