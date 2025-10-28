export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  startDate: string; // ISO or human string
  endDate?: string; // ISO or "Present"
  location?: string;
  summary?: string;
  logo?: string; // optional logo url
  tags?: string[];
  url?: string;
  images?: string[];
}
