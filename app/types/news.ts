export interface NewsItem {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  updatedAt?: string;
  coverImage?: string;
  images?: { src: string; alt?: string }[];
  tags?: string[];
  url?: string;
  draft?: boolean;
  pinned?: boolean;
}
