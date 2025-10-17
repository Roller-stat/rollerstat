import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `**/*.mdx`,
  contentType: "mdx",
  isSingleton: false,
  fields: {
    title: {
      type: "string",
      description: "The title of the post",
      required: true,
    },
    slug: {
      type: "string",
      description: "The slug of the post",
      required: true,
    },
    summary: {
      type: "string",
      description: "The summary of the post",
      required: true,
    },
    date: {
      type: "date",
      description: "The date of the post",
      required: true,
    },
    updated: {
      type: "date",
      description: "The last updated date of the post",
      required: false,
    },
    locale: {
      type: "enum",
      options: ["en", "es", "fr", "it", "pt"],
      description: "The locale of the post",
      required: true,
    },
    tags: {
      type: "list",
      of: { type: "string" },
      description: "Tags for the post",
      required: false,
    },
    coverImage: {
      type: "string",
      description: "Cover image URL for the post",
      required: false,
    },
    heroVideo: {
      type: "string",
      description: "Hero video URL for the post",
      required: false,
    },
    author: {
      type: "string",
      description: "The author of the post",
      required: true,
    },
    translation_key: {
      type: "string",
      description: "Key for linking translations of the same post",
      required: false,
    },
    contentType: {
      type: "enum",
      options: ["news", "blog"],
      description: "The type of content (news or blog)",
      required: true,
    },
    featured: {
      type: "boolean",
      description: "Whether the post is featured",
      required: false,
      default: false,
    },
    published: {
      type: "boolean",
      description: "Whether the post is published",
      required: false,
      default: true,
    },
  },
  computedFields: {
    readingTime: {
      type: "number",
      description: "Reading time in minutes",
      resolve: (doc: any) => {
        try {
          const wordsPerMinute = 200;
          const text = doc.body?.raw || "";
          const wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
          return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
        } catch (error) {
          console.error("Error calculating reading time:", error);
          return 1; // Default to 1 minute
        }
      },
    },
    url: {
      type: "string",
      description: "The URL of the post",
      resolve: (doc: any) => `/${doc.locale}/${doc.contentType}/${doc.slug}`,
    },
  },
}));

export default makeSource({
  contentDirPath: "./content",
  documentTypes: [Post],
  disableImportAliasWarning: true,
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            className: ["anchor"],
          },
        },
      ],
      [
        rehypePrettyCode,
        {
          theme: "github-dark",
          keepBackground: false,
        },
      ],
    ],
  },
});
