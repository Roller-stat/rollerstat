import { allPosts, Post } from "contentlayer/generated";
import { Locale } from "@/lib/i18n";

export function isValidPost(post: Post): boolean {
  return !!(
    post.title &&
    post.slug &&
    post.summary &&
    post.date &&
    post.locale &&
    post.contentType &&
    post.author
  );
}

export function validatePostData(post: Post): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!post.title) errors.push("Title is required");
  if (!post.slug) errors.push("Slug is required");
  if (!post.summary) errors.push("Summary is required");
  if (!post.date) errors.push("Date is required");
  if (!post.locale) errors.push("Locale is required");
  if (!post.contentType) errors.push("Content type is required");
  if (!post.author) errors.push("Author is required");

  // Validate date format
  if (post.date && isNaN(new Date(post.date).getTime())) {
    errors.push("Invalid date format");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getAllPosts(): Post[] {
  return allPosts.sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostsByLocale(locale: Locale): Post[] {
  const posts = allPosts
    .filter((post: Post) =>
      isValidPost(post) &&
      post.locale === locale &&
      post.published !== false
    )
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Debug logging to help troubleshoot
  console.log(`getPostsByLocale(${locale}): Found ${posts.length} posts`);
  if (posts.length > 0) {
    console.log(`Latest post: ${posts[0].title} (${posts[0].date})`);
  }
  
  return posts;
}

export function getPostsByType(type: "news" | "blog", locale: Locale): Post[] {
  const posts = allPosts
    .filter((post: Post) =>
      isValidPost(post) &&
      post.contentType === type &&
      post.locale === locale &&
      post.published !== false
    )
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Debug logging to help troubleshoot
  console.log(`getPostsByType(${type}, ${locale}): Found ${posts.length} posts`);
  if (posts.length > 0) {
    console.log(`Latest ${type} post: ${posts[0].title} (${posts[0].date})`);
  }
  
  return posts;
}

export function getLatestPost(locale: Locale): Post | undefined {
  const posts = getPostsByLocale(locale);
  console.log(`getLatestPost for locale ${locale}:`, posts.length, 'posts found');
  if (posts.length > 0) {
    console.log('Latest post:', posts[0].title, posts[0].locale);
  }
  return posts[0];
}

export function getLatestBlogs(locale: Locale, limit: number = 3): Post[] {
  const blogs = getPostsByType("blog", locale);
  return blogs.slice(0, limit);
}

export function getPostBySlug(slug: string, locale: Locale, type: "news" | "blog"): Post | undefined {
  return allPosts.find(
    (post: Post) => post.slug === slug && post.locale === locale && post.contentType === type && post.published !== false
  );
}

export function getRelatedPosts(post: Post, limit: number = 3): Post[] {
  return allPosts
    .filter(
      (p: Post) =>
        p._id !== post._id &&
        p.locale === post.locale &&
        p.published !== false &&
        p.tags?.some((tag: string) => post.tags?.includes(tag))
    )
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export function formatDate(date: string, locale: Locale): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }
    return dateObj.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return new Date().toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

export function getTimeAgo(date: string, locale: Locale): string {
  try {
    const now = new Date();
    const postDate = new Date(date);

    if (isNaN(postDate.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }

    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return locale === "es" ? "Hace menos de 1 hora" : "Less than 1 hour ago";
    } else if (diffInHours < 24) {
      return locale === "es" ? `Hace ${diffInHours} horas` : `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return locale === "es" ? `Hace ${diffInDays} días` : `${diffInDays} days ago`;
    }
  } catch (error) {
    console.error("Error calculating time ago:", error);
    return locale === "es" ? "Fecha no disponible" : "Date not available";
  }
}

// Filter posts by date range
export function filterPostsByDateRange(
  posts: Post[], 
  dateRange: string
): Post[] {
  const now = new Date();
  const ranges: Record<string, number | null> = {
    '7days': 7,
    '30days': 30,
    '3months': 90,
    'all': null
  };
  
  if (dateRange === 'all' || !dateRange) return posts;
  
  const days = ranges[dateRange];
  if (!days) return posts;
  
  const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  
  return posts.filter(post => new Date(post.date) >= cutoffDate);
}

// Filter posts by specific date
export function filterPostsByCustomDate(
  posts: Post[], 
  customDate: string
): Post[] {
  if (!customDate) return posts;
  
  const targetDate = new Date(customDate);
  
  return posts.filter(post => {
    const postDate = new Date(post.date);
    return postDate.toDateString() === targetDate.toDateString();
  });
}

// Sort posts by date
export function sortPostsByDate(
  posts: Post[], 
  order: 'asc' | 'desc' = 'desc'
): Post[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

// Combined filter and sort function
export function filterAndSortPosts(
  posts: Post[],
  filters: {
    dateRange?: string;
    customDate?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Post[] {
  let filtered = posts;
  
  // Apply custom date filter first (more specific)
  if (filters.customDate) {
    filtered = filterPostsByCustomDate(filtered, filters.customDate);
  } 
  // Otherwise apply date range filter
  else if (filters.dateRange && filters.dateRange !== 'all') {
    filtered = filterPostsByDateRange(filtered, filters.dateRange);
  }
  
  // Apply sorting
  filtered = sortPostsByDate(filtered, filters.sortOrder || 'desc');
  
  return filtered;
}