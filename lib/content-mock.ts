import { Locale } from "@/lib/i18n";

// Mock data structure that matches the contentlayer Post type
export interface Post {
  _id: string;
  _raw: any;
  type: string;
  title: string;
  slug: string;
  summary: string;
  date: string;
  updated?: string;
  locale: Locale;
  tags?: string[];
  coverImage?: string;
  heroVideo?: string;
  author: string;
  translation_key?: string;
  contentType: "news" | "blog";
  featured?: boolean;
  published?: boolean;
  readingTime: number;
  url: string;
  body: {
    raw: string;
    code: string;
  };
}

// Mock data
const mockPosts: Post[] = [
  {
    _id: "en/news/championship-finals-2024.mdx",
    _raw: {},
    type: "Post",
    title: "European Roller Hockey Championship Finals 2024",
    slug: "championship-finals-2024",
    summary: "Spain defeats Portugal in a thrilling final match to claim the European Roller Hockey Championship title for 2024.",
    date: "2024-01-15",
    locale: "en",
    tags: ["championship", "spain", "portugal", "finals"],
    coverImage: "https://res.cloudinary.com/rollerstat/image/upload/v1705123456/championship-2024.jpg",
    author: "Rollerstat Editorial Team",
    translation_key: "championship-finals-2024",
    contentType: "news",
    featured: true,
    published: true,
    readingTime: 2,
    url: "/en/news/championship-finals-2024",
    body: {
      raw: "# European Roller Hockey Championship Finals 2024\n\nThe European Roller Hockey Championship came to a spectacular conclusion this weekend as Spain secured a dramatic victory over Portugal in the final match, winning 4-3 in overtime.",
      code: "export default function MDXContent() { return <div>Content</div>; }"
    }
  },
  {
    _id: "en/blogs/tactical-analysis-2024.mdx",
    _raw: {},
    type: "Post",
    title: "Tactical Analysis: The Evolution of Modern Roller Hockey",
    slug: "tactical-analysis-2024",
    summary: "An in-depth look at how tactical innovations are reshaping the game of roller hockey in 2024.",
    date: "2024-01-12",
    locale: "en",
    tags: ["tactics", "analysis", "strategy", "evolution"],
    coverImage: "https://res.cloudinary.com/rollerstat/image/upload/v1705123456/tactical-analysis.jpg",
    author: "Marco Rodriguez",
    translation_key: "tactical-analysis-2024",
    contentType: "blog",
    featured: false,
    published: true,
    readingTime: 3,
    url: "/en/blogs/tactical-analysis-2024",
    body: {
      raw: "# Tactical Analysis: The Evolution of Modern Roller Hockey\n\nThe landscape of roller hockey has undergone significant tactical evolution over the past few years.",
      code: "export default function MDXContent() { return <div>Content</div>; }"
    }
  },
  {
    _id: "es/news/finales-campeonato-2024.mdx",
    _raw: {},
    type: "Post",
    title: "Finales del Campeonato Europeo de Hockey Patines 2024",
    slug: "finales-campeonato-2024",
    summary: "España derrota a Portugal en un emocionante partido final para reclamar el título del Campeonato Europeo de Hockey Patines 2024.",
    date: "2024-01-15",
    locale: "es",
    tags: ["campeonato", "españa", "portugal", "finales"],
    coverImage: "https://res.cloudinary.com/rollerstat/image/upload/v1705123456/championship-2024.jpg",
    author: "Equipo Editorial de Rollerstat",
    translation_key: "championship-finals-2024",
    contentType: "news",
    featured: true,
    published: true,
    readingTime: 2,
    url: "/es/news/finales-campeonato-2024",
    body: {
      raw: "# Finales del Campeonato Europeo de Hockey Patines 2024\n\nEl Campeonato Europeo de Hockey Patines llegó a una conclusión espectacular este fin de semana.",
      code: "export default function MDXContent() { return <div>Content</div>; }"
    }
  },
  {
    _id: "es/blogs/analisis-tactico-2024.mdx",
    _raw: {},
    type: "Post",
    title: "Análisis Táctico: La Evolución del Hockey Patines Moderno",
    slug: "analisis-tactico-2024",
    summary: "Una mirada profunda a cómo las innovaciones tácticas están remodelando el juego del hockey patines en 2024.",
    date: "2024-01-12",
    locale: "es",
    tags: ["tácticas", "análisis", "estrategia", "evolución"],
    coverImage: "https://res.cloudinary.com/rollerstat/image/upload/v1705123456/tactical-analysis.jpg",
    author: "Marco Rodríguez",
    translation_key: "tactical-analysis-2024",
    contentType: "blog",
    featured: false,
    published: true,
    readingTime: 3,
    url: "/es/blogs/analisis-tactico-2024",
    body: {
      raw: "# Análisis Táctico: La Evolución del Hockey Patines Moderno\n\nEl panorama del hockey patines ha experimentado una evolución táctica significativa en los últimos años.",
      code: "export default function MDXContent() { return <div>Content</div>; }"
    }
  }
];

// Validation functions
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
  return mockPosts.sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostsByLocale(locale: Locale): Post[] {
  return mockPosts
    .filter((post: Post) => 
      isValidPost(post) && 
      post.locale === locale && 
      post.published !== false
    )
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostsByType(type: "news" | "blog", locale: Locale): Post[] {
  return mockPosts
    .filter((post: Post) => 
      isValidPost(post) && 
      post.contentType === type && 
      post.locale === locale && 
      post.published !== false
    )
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getLatestPost(locale: Locale): Post | undefined {
  const posts = getPostsByLocale(locale);
  return posts[0];
}

export function getLatestBlogs(locale: Locale, limit: number = 3): Post[] {
  const blogs = getPostsByType("blog", locale);
  return blogs.slice(0, limit);
}

export function getPostBySlug(slug: string, locale: Locale, type: "news" | "blog"): Post | undefined {
  return mockPosts.find(
    (post: Post) => post.slug === slug && post.locale === locale && post.contentType === type && post.published !== false
  );
}

export function getRelatedPosts(post: Post, limit: number = 3): Post[] {
  return mockPosts
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
