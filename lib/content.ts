// Temporarily using mock data due to contentlayer integration issues
// import { allPosts, Post } from "contentlayer/generated";
import { Post } from "./content-mock";
import { Locale } from "@/lib/i18n";

// Re-export all functions from mock
export {
  getAllPosts,
  getPostsByLocale,
  getPostsByType,
  getLatestPost,
  getLatestBlogs,
  getPostBySlug,
  getRelatedPosts,
  formatDate,
  getTimeAgo,
  isValidPost,
  validatePostData
} from "./content-mock";