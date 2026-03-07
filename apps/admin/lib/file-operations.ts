import fs from "fs-extra"
import path from "path"

export interface PostData {
  title: string
  author: string
  summary: string
  type: "news" | "blog"
  locale: string
  date?: string
  updated?: string
  coverImage?: string
  heroVideo?: string
  published: boolean
  tags: string[]
  content: string
  translation_key?: string
  targetLocales?: ("en" | "es" | "fr" | "it" | "pt")[]
  translationMode?: "translate-only"
}

export interface PostFile {
  id: string
  postId?: string
  slug: string
  filePath: string
  data: PostData
}

function resolveSharedContentRoot(): string {
  const configured = process.env.CONTENT_ROOT
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured)
  }

  const candidates = [
    path.join(process.cwd(), "packages", "content", "posts"),
    path.join(process.cwd(), "..", "packages", "content", "posts"),
    path.join(process.cwd(), "..", "..", "packages", "content", "posts"),
    path.join(process.cwd(), "content"),
  ]

  const existing = candidates.find(candidate => fs.existsSync(candidate))
  return existing ?? candidates[0]
}

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim()
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
}

/**
 * Generate a unique translation key
 */
export function generateTranslationKey(title: string): string {
  return generateSlug(title)
}

/**
 * Generate MDX frontmatter from post data
 */
export function generateFrontmatter(data: PostData, slug: string): string {
  const frontmatter = {
    title: data.title,
    slug: slug,
    summary: data.summary,
    date: new Date().toISOString(), // Full ISO string with time
    locale: data.locale,
    tags: data.tags,
    coverImage: data.coverImage || undefined,
    heroVideo: data.heroVideo || undefined,
    author: data.author,
    translation_key: data.translation_key || generateTranslationKey(data.title),
    contentType: data.type,
    featured: false, // Always set to false
    published: data.published,
  }

  // Remove undefined values
  const cleanFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(([, value]) => value !== undefined)
  )

  return `---\n${Object.entries(cleanFrontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `"${v}"`).join(", ")}]`
      }
      if (typeof value === "string") {
        return `${key}: "${value}"`
      }
      return `${key}: ${value}`
    })
    .join("\n")}\n---\n\n`
}

/**
 * Clean MDX content (minimal processing since we're now using raw MDX)
 */
export function cleanContentForMDX(content: string): string {
  return content
    // Just ensure proper line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Trim whitespace
    .trim()
}


/**
 * Generate complete MDX content
 */
export function generateMDXContent(data: PostData, slug: string): string {
  const frontmatter = generateFrontmatter(data, slug)
  const cleanedContent = cleanContentForMDX(data.content)
  return frontmatter + cleanedContent
}

/**
 * Get the content directory path for a specific locale and type
 */
export function getContentPath(locale: string, type: "news" | "blog"): string {
  const pluralType = type === "news" ? "news" : "blogs"
  return path.join(resolveSharedContentRoot(), locale, pluralType)
}

/**
 * Get the full file path for a post
 */
export function getPostFilePath(locale: string, type: "news" | "blog", slug: string): string {
  const contentPath = getContentPath(locale, type)
  return path.join(contentPath, `${slug}.mdx`)
}

/**
 * Ensure content directory exists
 */
export async function ensureContentDirectory(locale: string, type: "news" | "blog"): Promise<void> {
  const contentPath = getContentPath(locale, type)
  await fs.ensureDir(contentPath)
}

/**
 * Check if a post file exists
 */
export async function postExists(locale: string, type: "news" | "blog", slug: string): Promise<boolean> {
  const filePath = getPostFilePath(locale, type, slug)
  return await fs.pathExists(filePath)
}

/**
 * Create a new post file
 */
export async function createPost(data: PostData): Promise<{
  success: boolean
  slug: string
  filePath: string
  generatedLocales?: ("en" | "es" | "fr" | "it" | "pt")[]
  skippedLocales?: ("en" | "es" | "fr" | "it" | "pt")[]
  failedLocales?: Array<{ locale: "en" | "es" | "fr" | "it" | "pt"; reason: string }>
  error?: string
}> {
  try {
    const slug = generateSlug(data.title)
    
    // Check if post already exists
    if (await postExists(data.locale, data.type, slug)) {
      return {
        success: false,
        slug,
        filePath: "",
        error: `Post with slug "${slug}" already exists in ${data.locale}/${data.type}`
      }
    }

    // Ensure content directory exists
    await ensureContentDirectory(data.locale, data.type)

    // Generate MDX content
    const mdxContent = generateMDXContent(data, slug)

    // Write file
    const filePath = getPostFilePath(data.locale, data.type, slug)
    await fs.writeFile(filePath, mdxContent, "utf8")

    return {
      success: true,
      slug,
      filePath,
    }
  } catch (error) {
    return {
      success: false,
      slug: "",
      filePath: "",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Update an existing post file
 */
export async function updatePost(
  locale: string,
  type: "news" | "blog",
  slug: string,
  data: Partial<PostData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = getPostFilePath(locale, type, slug)
    
    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      return {
        success: false,
        error: `Post with slug "${slug}" not found in ${locale}/${type}`
      }
    }

    // Read existing file
    const existingContent = await fs.readFile(filePath, "utf8")
    
    // Parse frontmatter and content
    const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/)
    if (!frontmatterMatch) {
      return {
        success: false,
        error: "Invalid MDX file format"
      }
    }

    const [, frontmatterContent, bodyContent] = frontmatterMatch
    
    // Parse existing frontmatter
    const existingData: Record<string, string | boolean | string[]> = {}
    frontmatterContent.split("\n").forEach(line => {
      const [key, ...valueParts] = line.split(":")
      if (key && valueParts.length > 0) {
        let value = valueParts.join(":").trim()
        
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        
        // Parse arrays
        if (value.startsWith("[") && value.endsWith("]")) {
          const arrayContent = value.slice(1, -1)
          existingData[key.trim()] = arrayContent ? arrayContent.split(",").map(v => v.trim().replace(/"/g, "")) : []
        }
        // Parse booleans
        else if (value === "true" || value === "false") {
          existingData[key.trim()] = value === "true"
        }
        // Parse dates
        else if (key.trim() === "date" || key.trim() === "updated") {
          existingData[key.trim()] = value
        }
        // Default to string
        else {
          existingData[key.trim()] = value
        }
      }
    })

    // Merge with new data
    const updatedData: PostData = {
      title: data.title || (existingData.title as string),
      author: data.author || (existingData.author as string),
      summary: data.summary || (existingData.summary as string),
      type: data.type || (existingData.contentType as "news" | "blog"),
      locale: data.locale || (existingData.locale as string),
      coverImage: data.coverImage !== undefined ? data.coverImage : (existingData.coverImage as string | undefined),
      heroVideo: data.heroVideo !== undefined ? data.heroVideo : (existingData.heroVideo as string | undefined),
      published: data.published !== undefined ? data.published : (existingData.published as boolean),
      tags: data.tags || (existingData.tags as string[]) || [],
      content: data.content !== undefined ? data.content : bodyContent,
      translation_key: data.translation_key || (existingData.translation_key as string | undefined),
    }

    // Generate new content
    const newSlug = data.title ? generateSlug(data.title) : slug
    const mdxContent = generateMDXContent(updatedData, newSlug)

    // If slug changed, create new file and delete old one
    if (newSlug !== slug) {
      const newFilePath = getPostFilePath(locale, type, newSlug)
      await fs.writeFile(newFilePath, mdxContent, "utf8")
      await fs.remove(filePath)
    } else {
      await fs.writeFile(filePath, mdxContent, "utf8")
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Delete a post file
 */
export async function deletePost(locale: string, type: "news" | "blog", slug: string): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = getPostFilePath(locale, type, slug)
    
    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      return {
        success: false,
        error: `Post with slug "${slug}" not found in ${locale}/${type}`
      }
    }

    // Delete file
    await fs.remove(filePath)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * List all posts in a directory
 */
export async function listPosts(locale?: string, type?: "news" | "blog"): Promise<PostFile[]> {
  try {
    const posts: PostFile[] = []
    const contentDir = resolveSharedContentRoot()
    
    if (!(await fs.pathExists(contentDir))) {
      return posts
    }

    const locales = locale ? [locale] : await fs.readdir(contentDir)
    
    for (const loc of locales) {
      const localePath = path.join(contentDir, loc)
      if (!(await fs.stat(localePath)).isDirectory()) continue
      
      const types = type ? [type === "news" ? "news" : "blogs"] : ["news", "blogs"]
      
      for (const contentType of types) {
        const typePath = path.join(localePath, contentType)
        if (!(await fs.pathExists(typePath))) continue
        
        const files = await fs.readdir(typePath)
        const mdxFiles = files.filter(file => file.endsWith(".mdx"))
        
        for (const file of mdxFiles) {
          const filePath = path.join(typePath, file)
          const filenameSlug = file.replace(".mdx", "")
          
          try {
            const content = await fs.readFile(filePath, "utf8")
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/)
            
            if (frontmatterMatch) {
              const [, frontmatterContent, bodyContent] = frontmatterMatch
              
              // Parse frontmatter
              const data: Record<string, string | boolean | string[]> = {}
              frontmatterContent.split("\n").forEach(line => {
                const [key, ...valueParts] = line.split(":")
                if (key && valueParts.length > 0) {
                  let value = valueParts.join(":").trim()
                  
                  // Remove quotes
                  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1)
                  }
                  
                  // Parse arrays
                  if (value.startsWith("[") && value.endsWith("]")) {
                    const arrayContent = value.slice(1, -1)
                    data[key.trim()] = arrayContent ? arrayContent.split(",").map(v => v.trim().replace(/"/g, "")) : []
                  }
                  // Parse booleans
                  else if (value === "true" || value === "false") {
                    data[key.trim()] = value === "true"
                  }
                  // Default to string
                  else {
                    data[key.trim()] = value
                  }
                }
              })
              
              posts.push({
                id: `${loc}-${contentType}-${filenameSlug}`,
                slug: (data.slug as string) || filenameSlug,
                filePath,
                data: {
                  title: (data.title as string) || "",
                  author: (data.author as string) || "",
                  summary: (data.summary as string) || "",
                  type: (data.contentType as "news" | "blog") || contentType,
                  locale: (data.locale as string) || loc,
                  coverImage: data.coverImage as string | undefined,
                  heroVideo: data.heroVideo as string | undefined,
                  published: (data.published as boolean) !== false,
                  tags: (data.tags as string[]) || [],
                  content: bodyContent,
                  translation_key: data.translation_key as string | undefined,
                }
              })
            }
          } catch (error) {
            console.error(`Error reading file ${filePath}:`, error)
          }
        }
      }
    }
    
    return posts
  } catch (error) {
    console.error("Error listing posts:", error)
    return []
  }
}
