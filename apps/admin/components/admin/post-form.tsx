"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Loader2, X, Plus, Eye, Edit3, AlertCircle, CheckCircle, Upload } from "lucide-react"
import { toast } from "sonner"

const LOCALES = ["en", "es", "fr", "it", "pt"] as const
type LocaleCode = (typeof LOCALES)[number]
const LOCALE_LABELS: Record<LocaleCode, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  it: "Italian",
  pt: "Portuguese",
}

const IMAGE_MAX_MB = 4
const VIDEO_MAX_MB = 20
const IMAGE_MAX_BYTES = IMAGE_MAX_MB * 1024 * 1024
const VIDEO_MAX_BYTES = VIDEO_MAX_MB * 1024 * 1024

const postSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  author: z.string()
    .min(1, "Author is required")
    .min(2, "Author name must be at least 2 characters")
    .max(50, "Author name must be less than 50 characters"),
  summary: z.string()
    .min(1, "Summary is required")
    .min(10, "Summary must be at least 10 characters")
    .max(300, "Summary must be less than 300 characters"),
  type: z.enum(["news", "blog"]),
  locale: z.enum(["en", "es", "fr", "it", "pt"]),
  coverImage: z.string()
    .url("Please enter a valid image URL")
    .optional()
    .or(z.literal("")),
  heroVideo: z.string()
    .url("Please enter a valid video URL")
    .optional()
    .or(z.literal("")),
  tags: z.array(z.string())
    .max(10, "Maximum 10 tags allowed")
})

type PostFormValues = z.infer<typeof postSchema>

interface PostFormProps {
  initialData?: Partial<PostFormValues> & { content?: string }
  onSubmit: (data: PostFormValues & {
    content: string
    featured: boolean
    published: boolean
    sendNewsletter?: boolean
    newsletterSubject?: string
    newsletterPreviewText?: string
    newsletterScheduleAt?: string
    targetLocales: LocaleCode[]
    translationMode: "translate-only"
  }) => void
  onSaveDraft?: (data: PostFormValues & {
    content: string
    featured: boolean
    published: boolean
    sendNewsletter?: boolean
    newsletterSubject?: string
    newsletterPreviewText?: string
    newsletterScheduleAt?: string
    targetLocales: LocaleCode[]
    translationMode: "translate-only"
  }) => void
  onGenerateLocales?: (data: PostFormValues & {
    content: string
    featured: boolean
    published: boolean
    targetLocales: LocaleCode[]
    translationMode: "translate-only"
  }) => Promise<void> | void
  availableTargetLocales?: LocaleCode[]
  isSubmitting?: boolean
  isGeneratingLocales?: boolean
  submitButtonText?: string
}

export function PostForm({
  initialData,
  onSubmit,
  onSaveDraft,
  onGenerateLocales,
  availableTargetLocales,
  isSubmitting = false,
  isGeneratingLocales = false,
  submitButtonText = "Save Post",
}: PostFormProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [content, setContent] = useState(initialData?.content || "")
  const [targetLocales, setTargetLocales] = useState<LocaleCode[]>([])
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false)
  const [isUploadingHeroVideo, setIsUploadingHeroVideo] = useState(false)
  const [newsletterMode, setNewsletterMode] = useState<"none" | "send_now" | "schedule">("none")
  const [newsletterSubject, setNewsletterSubject] = useState("")
  const [newsletterPreviewText, setNewsletterPreviewText] = useState("")
  const [newsletterScheduleAt, setNewsletterScheduleAt] = useState("")
  const coverImageInputRef = useRef<HTMLInputElement | null>(null)
  const heroVideoInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData?.title || "",
      author: initialData?.author || "",
      summary: initialData?.summary || "",
      type: initialData?.type || "news",
      locale: initialData?.locale || "en",
      coverImage: initialData?.coverImage || "",
      heroVideo: initialData?.heroVideo || "",
      tags: initialData?.tags || []
    }
  })
  const sourceLocale = form.watch("locale") as LocaleCode
  const sourcePostType = form.watch("type")

  const selectableLocales = useMemo(() => {
    const fromProps = availableTargetLocales ?? LOCALES
    return fromProps.filter((locale) => locale !== sourceLocale)
  }, [availableTargetLocales, sourceLocale])

  useEffect(() => {
    setTargetLocales((previous) =>
      previous.filter((locale) => locale !== sourceLocale && selectableLocales.includes(locale))
    )
  }, [sourceLocale, selectableLocales])

  const toggleTargetLocale = (locale: LocaleCode) => {
    setTargetLocales((previous) => {
      if (previous.includes(locale)) {
        return previous.filter((item) => item !== locale)
      }
      return [...previous, locale]
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      form.setValue("tags", newTags)
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    form.setValue("tags", newTags)
  }

  const validateMediaFile = (file: File, mediaType: "image" | "video"): string | null => {
    if (mediaType === "image") {
      if (!file.type.startsWith("image/")) {
        return "Please select a valid image file."
      }
      if (file.size > IMAGE_MAX_BYTES) {
        return `Image must be ${IMAGE_MAX_MB} MB or smaller.`
      }
      return null
    }

    if (!file.type.startsWith("video/")) {
      return "Please select a valid video file."
    }
    if (file.size > VIDEO_MAX_BYTES) {
      return `Video must be ${VIDEO_MAX_MB} MB or smaller.`
    }
    return null
  }

  const uploadMediaToCloudinary = async (
    file: File,
    mediaType: "image" | "video"
  ): Promise<string> => {
    const payload = new FormData()
    payload.append("file", file)
    payload.append("mediaType", mediaType)
    payload.append("postType", sourcePostType)

    const response = await fetch("/api/admin/media-upload", {
      method: "POST",
      body: payload,
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data?.url) {
      throw new Error(data?.error || "Upload failed")
    }

    return data.url as string
  }

  const handleCoverImageUpload = async (file: File) => {
    const validationError = validateMediaFile(file, "image")
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      setIsUploadingCoverImage(true)
      const uploadedUrl = await uploadMediaToCloudinary(file, "image")
      form.setValue("coverImage", uploadedUrl, { shouldValidate: true, shouldDirty: true })
      toast.success("Cover image uploaded successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload cover image")
    } finally {
      setIsUploadingCoverImage(false)
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = ""
      }
    }
  }

  const handleHeroVideoUpload = async (file: File) => {
    const validationError = validateMediaFile(file, "video")
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      setIsUploadingHeroVideo(true)
      const uploadedUrl = await uploadMediaToCloudinary(file, "video")
      form.setValue("heroVideo", uploadedUrl, { shouldValidate: true, shouldDirty: true })
      toast.success("Hero video uploaded successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload hero video")
    } finally {
      setIsUploadingHeroVideo(false)
      if (heroVideoInputRef.current) {
        heroVideoInputRef.current.value = ""
      }
    }
  }

  const handleSubmit = (values: PostFormValues) => {
    setIsValidating(true)
    setFormErrors([])

    try {
      // Validate content
      if (!content || content.trim().length < 10) {
        setFormErrors(["Content must be at least 10 characters long"])
        setIsValidating(false)
        return
      }

      // Check for potential content issues
      const contentWarnings: string[] = []
      if (content.includes('<script>') || content.includes('javascript:')) {
        contentWarnings.push("Content contains JavaScript code - this may cause rendering issues")
      }
      
      // Show warnings but don't block submission
      if (contentWarnings.length > 0) {
        console.warn("Content warnings:", contentWarnings)
      }

      // Tags are now optional - no validation needed

      // Validate URLs if provided
      const errors: string[] = []
      if (values.coverImage && values.coverImage.trim() !== "") {
        try {
          new URL(values.coverImage)
        } catch {
          errors.push("Please enter a valid cover image URL")
        }
      }
      if (values.heroVideo && values.heroVideo.trim() !== "") {
        try {
          new URL(values.heroVideo)
        } catch {
          errors.push("Please enter a valid hero video URL")
        }
      }

      if (errors.length > 0) {
        setFormErrors(errors)
        setIsValidating(false)
        return
      }

      // All validations passed - Create Post = Published
      onSubmit({
        ...values,
        content,
        featured: false,
        published: true,
        sendNewsletter: newsletterMode !== "none",
        newsletterSubject: newsletterMode !== "none" ? (newsletterSubject.trim() || values.title) : undefined,
        newsletterPreviewText:
          newsletterMode !== "none" && newsletterPreviewText.trim()
            ? newsletterPreviewText.trim()
            : undefined,
        newsletterScheduleAt:
          newsletterMode === "schedule" && newsletterScheduleAt.trim()
            ? newsletterScheduleAt.trim()
            : undefined,
        targetLocales,
        translationMode: "translate-only",
      })
    } catch {
      setFormErrors(["An unexpected error occurred. Please try again."])
    } finally {
      setIsValidating(false)
    }
  }

  const handleSaveDraft = (values: PostFormValues) => {
    if (onSaveDraft) {
      // For drafts, we don't require all validations
      const draftData = {
        ...values,
        content,
        published: false,
        featured: false,
        sendNewsletter: false,
        newsletterSubject: undefined,
        newsletterPreviewText: undefined,
        newsletterScheduleAt: undefined,
        targetLocales,
        translationMode: "translate-only" as const,
      }
      onSaveDraft(draftData)
    }
  }

  const handleGenerateLocaleDrafts = async (values: PostFormValues) => {
    if (!onGenerateLocales) {
      return
    }

    if (targetLocales.length === 0) {
      setFormErrors(["Select at least one target locale before generating locale drafts."])
      return
    }

    await onGenerateLocales({
      ...values,
      content,
      featured: false,
      published: false,
      targetLocales,
      translationMode: "translate-only",
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Post</CardTitle>
        <CardDescription>
          Fill in the details below to create a new news post or blog article
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit as (data: PostFormValues) => void)} className="space-y-6">
            {/* Form Validation Errors */}
            {formErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter post title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter author name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter a brief summary of the post"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Type and Language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="news">News</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Locale Draft Generation */}
            <div className="space-y-3">
              <FormLabel>Locale Drafts (Translate only)</FormLabel>
              <p className="text-xs text-muted-foreground">
                Select locales to auto-generate draft translations.
              </p>
              <div className="flex flex-wrap gap-2">
                {selectableLocales.map((locale) => {
                  const selected = targetLocales.includes(locale)
                  return (
                    <Button
                      key={locale}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTargetLocale(locale)}
                    >
                      {LOCALE_LABELS[locale]}
                    </Button>
                  )
                })}
              </div>
              {selectableLocales.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  All locales already exist for this post.
                </p>
              )}
              {onGenerateLocales && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.handleSubmit(handleGenerateLocaleDrafts as (data: PostFormValues) => void)}
                  disabled={isSubmitting || isValidating || isGeneratingLocales || targetLocales.length === 0}
                >
                  {isGeneratingLocales ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Drafts...
                    </>
                  ) : (
                    "Generate Draft Locales"
                  )}
                </Button>
              )}
            </div>

            {/* Media URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL</FormLabel>
                    <div className="space-y-2">
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <input
                        ref={coverImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) {
                            void handleCoverImageUpload(file)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => coverImageInputRef.current?.click()}
                        disabled={isUploadingCoverImage}
                      >
                        {isUploadingCoverImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading Image...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image ({IMAGE_MAX_MB} MB max)
                          </>
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heroVideo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero Video URL</FormLabel>
                    <div className="space-y-2">
                      <FormControl>
                        <Input placeholder="https://example.com/video.mp4" {...field} />
                      </FormControl>
                      <input
                        ref={heroVideoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) {
                            void handleHeroVideoUpload(file)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => heroVideoInputRef.current?.click()}
                        disabled={isUploadingHeroVideo}
                      >
                        {isUploadingHeroVideo ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading Video...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Video ({VIDEO_MAX_MB} MB max)
                          </>
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* MDX Content Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Content (MDX Format) *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
              
              {showPreview ? (
                <div className="border rounded-lg p-4 min-h-[300px] bg-muted/40">
                  <div className="prose max-w-none">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">MDX Preview:</h4>
                    <div className="text-sm text-foreground">
                      {content ? (
                        <div 
                          className="max-w-none"
                          style={{
                            fontSize: '0.875rem',
                            lineHeight: '1.5'
                          }}
                          dangerouslySetInnerHTML={{
                            __html: content
                              // First, split by double line breaks to separate paragraphs
                              .split('\n\n')
                              .map(paragraph => paragraph.trim())
                              .filter(paragraph => paragraph.length > 0)
                              .map(paragraph => {
                                // Convert headings with proper spacing (matching website)
                                if (paragraph.match(/^### (.*$)/)) {
                                  return paragraph.replace(/^### (.*$)/, '<h3 style="font-size: 1.125rem; font-weight: 600; margin: 1rem 0; line-height: 1.4; color: var(--foreground);">$1</h3>');
                                }
                                if (paragraph.match(/^## (.*$)/)) {
                                  return paragraph.replace(/^## (.*$)/, '<h2 style="font-size: 1.25rem; font-weight: 600; margin: 1rem 0; line-height: 1.3; color: var(--foreground);">$1</h2>');
                                }
                                if (paragraph.match(/^# (.*$)/)) {
                                  return paragraph.replace(/^# (.*$)/, '<h1 style="font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0; line-height: 1.2; color: var(--foreground);">$1</h1>');
                                }
                                
                                // Convert list items
                                if (paragraph.includes('\n- ')) {
                                  return paragraph
                                    .replace(/^\- (.+)$/gim, '<li class="my-1">$1</li>')
                                    .replace(/(<li.*<\/li>)(\s*<li.*<\/li>)*/g, '<ul class="list-disc list-inside my-4">$&</ul>');
                                }
                                
                                // For regular paragraphs, convert single line breaks to <br> and apply formatting (matching website)
                                return `<p style="margin: 1rem 0; line-height: 1.6;">${paragraph
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
                                  .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
                                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
                                  .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" class="max-w-full h-auto rounded my-2" />')
                                  .replace(/\n(?!\n)/g, '<br>')
                                }</p>`;
                              })
                              .join('')
                          }}
                        />
                      ) : (
                        "No content to preview"
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Textarea
                  placeholder="Write your content in MDX format..."
                  className="min-h-[300px] font-mono text-sm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              )}
              
              <div className="text-xs text-muted-foreground">
                <p><strong>MDX Tips:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Use standard Markdown syntax for formatting</li>
                  <li>You can include JSX components if needed</li>
                  <li>Headings: <code># Heading 1</code>, <code>## Heading 2</code>, <code>### Heading 3</code></li>
                  <li>Bold and italic: <code>**bold**</code>, <code>*italic*</code></li>
                  <li>Images: <code>![alt](url)</code></li>
                  <li>Links: <code>[text](url)</code></li>
                  <li>Blockquotes: <code>&gt; quote</code></li>
                  <li>Code blocks: Use triple backticks with language</li>
                </ul>
                <div className="mt-3 rounded-md border bg-muted/40 p-3">
                  <p className="mb-2 text-xs font-medium text-foreground">Starter example:</p>
                  <pre className="whitespace-pre-wrap text-xs leading-5 text-foreground">
{`# Heading 1
## Heading 2

**Bold text** and *italic text*

- List item 1
- List item 2

[Link text](https://example.com)

![Image alt text](https://example.com/image.jpg)

> Blockquote

\`\`\`javascript
// Code block
console.log('Hello World');
\`\`\``}
                  </pre>
                </div>
              </div>
            </div>


            <Separator />

            {/* Newsletter Campaign */}
            <div className="space-y-3">
              <FormLabel>Newsletter Campaign</FormLabel>
              <p className="text-xs text-muted-foreground">
                Optional: send this post as a newsletter campaign when publishing.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={newsletterMode === "none" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewsletterMode("none")}
                >
                  No campaign
                </Button>
                <Button
                  type="button"
                  variant={newsletterMode === "send_now" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewsletterMode("send_now")}
                >
                  Send now
                </Button>
                <Button
                  type="button"
                  variant={newsletterMode === "schedule" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewsletterMode("schedule")}
                >
                  Schedule
                </Button>
              </div>

              {newsletterMode !== "none" && (
                <div className="grid grid-cols-1 gap-3 rounded-md border bg-muted/30 p-3 md:grid-cols-2">
                  <Input
                    placeholder="Newsletter subject (defaults to post title)"
                    value={newsletterSubject}
                    onChange={(event) => setNewsletterSubject(event.target.value)}
                  />
                  <Input
                    placeholder="Preview text (optional)"
                    value={newsletterPreviewText}
                    onChange={(event) => setNewsletterPreviewText(event.target.value)}
                  />
                  {newsletterMode === "schedule" && (
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs text-muted-foreground">Schedule time</label>
                      <Input
                        type="datetime-local"
                        value={newsletterScheduleAt}
                        onChange={(event) => setNewsletterScheduleAt(event.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              {onSaveDraft && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={form.handleSubmit(handleSaveDraft as (data: PostFormValues) => void)}
                  disabled={isSubmitting || isValidating}
                >
                  Save Draft
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting || isValidating}>
                {isSubmitting || isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isValidating ? "Validating..." : `${submitButtonText}...`}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {submitButtonText}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
