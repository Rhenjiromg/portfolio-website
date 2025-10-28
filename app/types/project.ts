export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  tags?: string[];
  starred?: boolean; // personal highlight
  pinned?: boolean; // show first
  repoUrl?: string;
  liveUrl?: string;
  updatedAt?: string; // ISO string, used for sort fallback
}
