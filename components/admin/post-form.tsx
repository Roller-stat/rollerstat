"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Loader2, X, Plus, Bold, Italic, List, Link as LinkIcon, Image as ImageIcon, AlertCircle, CheckCircle } from "lucide-react"

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
  locale: z.enum(["en", "es", "fr", "de", "it"]),
  coverImage: z.string()
    .url("Please enter a valid image URL")
    .optional()
    .or(z.literal("")),
  heroVideo: z.string()
    .url("Please enter a valid video URL")
    .optional()
    .or(z.literal("")),
  featured: z.boolean(),
  published: z.boolean(),
  tags: z.array(z.string())
    .min(1, "At least one tag is required")
    .max(10, "Maximum 10 tags allowed")
})

type PostFormValues = z.infer<typeof postSchema>

interface PostFormProps {
  initialData?: Partial<PostFormValues> & { content?: string }
  onSubmit: (data: PostFormValues & { content: string }) => void
  isSubmitting?: boolean
  submitButtonText?: string
}

export function PostForm({ initialData, onSubmit, isSubmitting = false, submitButtonText = "Save Post" }: PostFormProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [content, setContent] = useState(initialData?.content || "")
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)

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
      featured: initialData?.featured || false,
      published: initialData?.published || false,
      tags: initialData?.tags || []
    }
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg"
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline"
        }
      }),
      Placeholder.configure({
        placeholder: "Write your content here..."
      })
    ],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
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

      // Validate tags
      if (tags.length === 0) {
        setFormErrors(["At least one tag is required"])
        setIsValidating(false)
        return
      }

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

      // All validations passed
      onSubmit({ ...values, content })
    } catch {
      setFormErrors(["An unexpected error occurred. Please try again."])
    } finally {
      setIsValidating(false)
    }
  }

  const insertImage = () => {
    const url = window.prompt("Enter image URL:")
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }

  const insertLink = () => {
    const url = window.prompt("Enter URL:")
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run()
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
                        <SelectItem value="de">German</SelectItem>
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

            {/* Rich Text Editor */}
            <div className="space-y-2">
              <FormLabel>Content *</FormLabel>
              <div className="border rounded-lg">
                {/* Toolbar */}
                <div className="border-b p-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={editor?.isActive("bold") ? "bg-gray-100" : ""}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={editor?.isActive("italic") ? "bg-gray-100" : ""}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    className={editor?.isActive("bulletList") ? "bg-gray-100" : ""}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={insertLink}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={insertImage}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
                {/* Editor */}
                <div className="p-4 min-h-[300px]">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded"
                      />
                    </FormControl>
                    <FormLabel>Featured Post</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded"
                      />
                    </FormControl>
                    <FormLabel>Published</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline">
                Save Draft
              </Button>
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
