"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Link as LinkIcon, Check, X, Loader2 } from "lucide-react"

interface ImageUploadProps {
  onImageSelect?: (url: string) => void
  onUpload?: (file: File) => Promise<string>
  className?: string
}

export function ImageUpload({ onImageSelect, onUpload, className }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [validationStatus, setValidationStatus] = useState<"idle" | "valid" | "invalid">("idle")
  const [dragActive, setDragActive] = useState(false)

  const validateImageUrl = async (url: string) => {
    if (!url) {
      setValidationStatus("idle")
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch(url, { method: "HEAD" })
      const contentType = response.headers.get("content-type")
      
      if (contentType && contentType.startsWith("image/")) {
        setValidationStatus("valid")
        if (onImageSelect) {
          onImageSelect(url)
        }
      } else {
        setValidationStatus("invalid")
      }
    } catch (error) {
      setValidationStatus("invalid")
    } finally {
      setIsValidating(false)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateImageUrl(url)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const handleFileUpload = async (file: File) => {
    if (!onUpload) {
      // If no upload handler, just validate the file
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setValidationStatus("valid")
      if (onImageSelect) {
        onImageSelect(url)
      }
      return
    }

    setIsUploading(true)
    try {
      const uploadedUrl = await onUpload(file)
      setImageUrl(uploadedUrl)
      setValidationStatus("valid")
      if (onImageSelect) {
        onImageSelect(uploadedUrl)
      }
    } catch (error) {
      setValidationStatus("invalid")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith("image/"))
    
    if (imageFile) {
      handleFileUpload(imageFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file)
    }
  }

  const clearImage = () => {
    setImageUrl("")
    setValidationStatus("idle")
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Image Upload
        </CardTitle>
        <CardDescription>
          Upload an image file or enter an image URL
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Image URL</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={handleUrlChange}
                className="pr-10"
              />
              {isValidating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {validationStatus === "valid" && !isValidating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              )}
              {validationStatus === "invalid" && !isValidating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <X className="h-4 w-4 text-red-500" />
                </div>
              )}
            </div>
            {imageUrl && (
              <Button variant="outline" onClick={clearImage}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Or upload a file</label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/10"
                : "border-border hover:border-ring/60"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                ) : (
                  <>
                    <span className="font-medium">Click to upload</span> or drag and drop
                    <br />
                    <span className="text-xs">PNG, JPG, GIF up to 10MB</span>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Validation Messages */}
        {validationStatus === "valid" && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              Image URL is valid and accessible.
            </AlertDescription>
          </Alert>
        )}

        {validationStatus === "invalid" && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>
              Invalid image URL or image is not accessible.
            </AlertDescription>
          </Alert>
        )}

        {/* Image Preview */}
        {imageUrl && validationStatus === "valid" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Preview</label>
            <div className="border rounded-lg p-4 bg-muted/40">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-w-full h-auto max-h-64 mx-auto rounded"
                onError={() => setValidationStatus("invalid")}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = "https://via.placeholder.com/800x400?text=Sample+Image"
              setImageUrl(url)
              validateImageUrl(url)
            }}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Use Sample Image
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
