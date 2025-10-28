import {
  collection,
  getDocs,
  orderBy,
  query,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { ExperienceItem } from "../types/experience";
import { NewsItem } from "../types/news";
import { ProjectItem } from "../types/project";
import { db } from "./firebase";

// Helpers to safely cast and default fields
const asNews = (d: QueryDocumentSnapshot): NewsItem => {
  const data = d.data() as Partial<NewsItem>;
  return {
    id: d.id,
    title: data.title ?? "",
    content: data.content ?? "",
    publishedAt: data.publishedAt ?? "",
    updatedAt: data.updatedAt ?? "",
    coverImage: data.coverImage ?? "",
    images: (data.images ?? []).map((x: any) => ({
      src: x?.src ?? "",
      alt: x?.alt ?? "",
    })),
    tags: data.tags ?? [],
    url: data.url ?? "",
    draft: !!data.draft,
    pinned: !!data.pinned,
  };
};

const asProject = (d: QueryDocumentSnapshot): ProjectItem => {
  const data = d.data() as Partial<ProjectItem>;
  return {
    id: d.id,
    title: data.title ?? "",
    description: data.description ?? "",
    coverImage: data.coverImage ?? "",
    tags: data.tags ?? [],
    starred: !!data.starred,
    pinned: !!data.pinned,
    repoUrl: data.repoUrl ?? "",
    liveUrl: data.liveUrl ?? "",
    updatedAt: data.updatedAt ?? "",
  };
};

const asExperience = (d: QueryDocumentSnapshot): ExperienceItem => {
  const data = d.data() as Partial<ExperienceItem>;
  return {
    id: d.id,
    company: data.company ?? "",
    role: data.role ?? "",
    startDate: data.startDate ?? "",
    endDate: data.endDate ?? "",
    location: data.location ?? "",
    summary: data.summary ?? "",
    logo: data.logo ?? "",
    tags: data.tags ?? [],
    url: data.url ?? "",
    images: data.images ?? [],
  };
};

// Fetchers
export async function getNews(): Promise<NewsItem[]> {
  const q = query(collection(db, "news"), orderBy("publishedAt", "desc"));
  const snap = await getDocs(q);
  if (snap.empty) return [];
  return snap.docs.map(asNews);
}

export async function getProjects(): Promise<ProjectItem[]> {
  const q = query(collection(db, "projects"), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  if (snap.empty) return [];
  return snap.docs.map(asProject);
}

export async function getExperiences(): Promise<ExperienceItem[]> {
  const q = query(collection(db, "experiences"), orderBy("startDate", "desc"));
  const snap = await getDocs(q);
  if (snap.empty) return [];
  return snap.docs.map(asExperience);
}
