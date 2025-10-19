"use client"

import { useState } from "react"
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
import { Loader2, X, Plus, Eye, Edit3, AlertCircle, CheckCircle } from "lucide-react"

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
    .default([])
})

type PostFormValues = z.infer<typeof postSchema>

interface PostFormProps {
  initialData?: Partial<PostFormValues> & { content?: string }
  onSubmit: (data: PostFormValues & { content: string; featured: boolean; published: boolean }) => void
  onSaveDraft?: (data: PostFormValues & { content: string; featured: boolean; published: boolean }) => void
  isSubmitting?: boolean
  submitButtonText?: string
}

export function PostForm({ initialData, onSubmit, onSaveDraft, isSubmitting = false, submitButtonText = "Save Post" }: PostFormProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [content, setContent] = useState(initialData?.content || "")
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

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

  const handleSubmit = async (values: PostFormValues) => {
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
      onSubmit({ ...values, content, featured: false, published: true })
    } catch {
      setFormErrors(["An unexpected error occurred. Please try again."])
    } finally {
      setIsValidating(false)
    }
  }

  const handleSaveDraft = async (values: PostFormValues) => {
    if (onSaveDraft) {
      // For drafts, we don't require all validations
      const draftData = { ...values, content, published: false, featured: false }
      onSaveDraft(draftData)
    }
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

            {/* Media URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="https://example.com/video.mp4" {...field} />
                    </FormControl>
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
                <div className="border rounded-lg p-4 min-h-[300px] bg-gray-50">
                  <div className="prose max-w-none">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">MDX Preview:</h4>
                    <div className="whitespace-pre-wrap text-sm text-gray-800">
                      {content || "No content to preview"}
                    </div>
                  </div>
                </div>
              ) : (
                <Textarea
                  placeholder="Write your content in MDX format...

Example:
# Heading 1
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
\`\`\`"
                  className="min-h-[300px] font-mono text-sm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              )}
              
              <div className="text-xs text-gray-500">
                <p>💡 <strong>MDX Tips:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Use standard Markdown syntax for formatting</li>
                  <li>You can include JSX components if needed</li>
                  <li>Images: <code>![alt](url)</code></li>
                  <li>Links: <code>[text](url)</code></li>
                  <li>Code blocks: Use triple backticks with language</li>
                </ul>
              </div>
            </div>


            <Separator />

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              {onSaveDraft && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={form.handleSubmit(handleSaveDraft)}
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
