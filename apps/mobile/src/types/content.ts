export type AppLocale = 'en' | 'es' | 'fr' | 'it' | 'pt';
export type PostType = 'news' | 'blog';

export type MobilePostSummary = {
  id: string;
  postId: string;
  title: string;
  slug: string;
  summary: string;
  date: string;
  updated: string | null;
  locale: AppLocale;
  tags: string[];
  coverImage: string | null;
  heroVideo: string | null;
  author: string;
  contentType: PostType;
  readingTime: number;
  url: string;
};

export type MobilePostDetail = MobilePostSummary & {
  body: string;
  interactionsEnabled: boolean;
};

export type MobileComment = {
  id: string;
  postId: string;
  postLocalizationId: string;
  userId: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    image?: string | null;
    email?: string | null;
  };
};

export type ReactionType = 'like' | 'applaud' | 'love' | 'dislike';

export type ReactionCounts = Record<ReactionType, number>;

export type MobileUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string;
};
