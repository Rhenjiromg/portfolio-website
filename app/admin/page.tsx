"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db, storage } from "@/app/utils/firebase"; // Firestore + Storage
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { LogOut, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ===== Types =====
export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  tags?: string[];
  starred?: boolean;
  pinned?: boolean;
  repoUrl?: string;
  liveUrl?: string;
  updatedAt?: string;
}

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

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  location?: string;
  summary?: string;
  logo?: string;
  tags?: string[];
  url?: string;
  images?: string[];
}

// ===== Helpers =====
const csvToArray = (v?: string) =>
  (v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const arrayToCsv = (arr?: string[]) =>
  arr && arr.length ? arr.join(", ") : "";
const textblockToArray = (v?: string) =>
  (v || "")
    .split("")
    .map((s) => s.trim())
    .filter(Boolean);
const arrayToTextblock = (arr?: string[]) =>
  arr && arr.length ? arr.join("") : "";
const imagesJsonToTextblock = (arr?: { src: string; alt?: string }[]) =>
  (arr || []).map((o) => (o.alt ? `${o.src} | ${o.alt}` : o.src)).join("");
const textblockToImagesJson = (v?: string): { src: string; alt?: string }[] =>
  textblockToArray(v).map((line) => {
    const [src, alt] = line.split("|").map((s) => s.trim());
    return { src, alt: alt || "" };
  });
const toISODateOrEmpty = (d?: string) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

// Client-side id generator
function genId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return (crypto as any).randomUUID();
  return `id_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// Upload a single file to public/assets/<id>/<timestamp>-<name>
async function uploadOne(file: File, id: string) {
  const path = `public/assets/${id}/${Date.now()}-${file.name}`;
  const ref = storageRef(storage, path);
  const snap = await uploadBytes(ref, file);
  return await getDownloadURL(snap.ref);
}

// Upload multiple files and return their URLs
async function uploadMany(files: File[], id: string) {
  const urls: string[] = [];
  for (const f of files) urls.push(await uploadOne(f, id));
  return urls;
}

// Replace undefined with empty string recursively (Firestore disallows undefined)
function replaceUndefinedWithEmpty<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((v) =>
      v === undefined
        ? ("" as any)
        : typeof v === "object" && v
        ? replaceUndefinedWithEmpty(v as any)
        : (v as any)
    ) as any;
  }
  if (obj && typeof obj === "object") {
    const out: any = {};
    Object.entries(obj as any).forEach(([k, v]) => {
      if (v === undefined) out[k] = "";
      else if (Array.isArray(v)) out[k] = replaceUndefinedWithEmpty(v);
      else if (v && typeof v === "object")
        out[k] = replaceUndefinedWithEmpty(v as any);
      else out[k] = v;
    });
    return out;
  }
  return obj === undefined ? ("" as any) : obj;
}

// Firestore wrappers (IMPORTANT: call Firestore functions, not self!)
async function setDocClean(ref: any, data: any) {
  return await setDoc(ref, replaceUndefinedWithEmpty(data));
}
async function updateDocClean(ref: any, data: any) {
  return await updateDoc(ref, replaceUndefinedWithEmpty(data));
}

// ===== Root =====
export default function AdminDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"PROJECTS" | "EXPERIENCES" | "NEWS">(
    "PROJECTS"
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace("/admin/login");
      else setChecking(false);
    });
    return () => unsub();
  }, [router]);

  if (checking) {
    return (
      <section className="px-6 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <div className="animate-pulse text-muted-foreground">
            Checking auth…
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Admin Dashboard
          </h1>
          <Button variant="outline" size="sm" onClick={() => signOut(auth)}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={tab === "PROJECTS" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("PROJECTS")}
          >
            Projects
          </Button>
          <Button
            variant={tab === "EXPERIENCES" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("EXPERIENCES")}
          >
            Experiences
          </Button>
          <Button
            variant={tab === "NEWS" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("NEWS")}
          >
            News
          </Button>
        </div>

        {tab === "PROJECTS" && <ProjectsList />}
        {tab === "EXPERIENCES" && <ExperiencesList />}
        {tab === "NEWS" && <NewsList />}
      </div>
    </section>
  );
}

// ===== Projects =====
const ProjectsList = () => {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectItem | null>(null);

  useEffect(() => {
    const qy = query(collection(db, "projects"), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(qy, (snap) => {
      const next: ProjectItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setItems(next);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await deleteDoc(doc(db, "projects", id));
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) setEditing(null);
            setOpen(v);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit project" : "New project"}
              </DialogTitle>
            </DialogHeader>
            <ProjectForm
              initial={editing || undefined}
              onCancel={() => {
                setOpen(false);
                setEditing(null);
              }}
              onSaved={() => {
                setOpen(false);
                setEditing(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {items.map((p) => (
          <div
            key={p.id}
            className="flex items-start justify-between rounded-2xl border p-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {p.pinned ? (
                  <span className="rounded bg-yellow-200/60 px-2 py-0.5 text-xs font-medium text-yellow-900">
                    Pinned
                  </span>
                ) : null}
                {p.starred ? (
                  <span className="rounded bg-emerald-200/60 px-2 py-0.5 text-xs font-medium text-emerald-900">
                    Starred
                  </span>
                ) : null}
              </div>
              <h3 className="truncate text-lg font-medium">{p.title}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {p.description}
              </p>
              <div className="mt-1 text-xs text-muted-foreground">
                {arrayToCsv(p.tags)}
              </div>
            </div>
            <div className="ml-4 shrink-0 space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditing(p);
                  setOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(p.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">
            No projects yet.
          </div>
        )}
      </div>
    </section>
  );
};

function ProjectForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: ProjectItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [repoUrl, setRepoUrl] = useState(initial?.repoUrl || "");
  const [liveUrl, setLiveUrl] = useState(initial?.liveUrl || "");
  const [tagsCsv, setTagsCsv] = useState(arrayToCsv(initial?.tags));
  const [starred, setStarred] = useState(!!initial?.starred);
  const [pinned, setPinned] = useState(!!initial?.pinned);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (initial?.id) {
        const id = initial.id;
        let coverUrl = coverImage;
        if (coverFile) coverUrl = await uploadOne(coverFile, id);
        const payload: Omit<ProjectItem, "id"> = replaceUndefinedWithEmpty({
          title,
          description,
          coverImage: coverUrl,
          repoUrl,
          liveUrl,
          tags: csvToArray(tagsCsv),
          starred,
          pinned,
          updatedAt: new Date().toISOString(),
        });
        await updateDocClean(doc(db, "projects", id), payload as any);
      } else {
        const id = genId();
        let coverUrl = coverImage;
        if (coverFile) coverUrl = await uploadOne(coverFile, id);
        const payload: Omit<ProjectItem, "id"> = replaceUndefinedWithEmpty({
          title,
          description,
          coverImage: coverUrl,
          repoUrl,
          liveUrl,
          tags: csvToArray(tagsCsv),
          starred,
          pinned,
          updatedAt: new Date().toISOString(),
        });
        await setDocClean(doc(db, "projects", id), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="p-title">Title</Label>
        <Input
          id="p-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-desc">Description</Label>
        <Textarea
          id="p-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-cover">Cover image URL (or upload below)</Label>
        <Input
          id="p-cover"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="https://..."
        />
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
        />
        <p className="text-xs text-muted-foreground">
          Uploads go to <code>public/assets/&lt;id&gt;/</code>. File upload wins
          over URL.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-tags">Tags (comma-separated)</Label>
        <Input
          id="p-tags"
          value={tagsCsv}
          onChange={(e) => setTagsCsv(e.target.value)}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="p-star"
            checked={starred}
            onCheckedChange={(v) => setStarred(!!v)}
          />
          <Label htmlFor="p-star">Starred</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="p-pin"
            checked={pinned}
            onCheckedChange={(v) => setPinned(!!v)}
          />
          <Label htmlFor="p-pin">Pinned</Label>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="p-repo">Repo URL</Label>
          <Input
            id="p-repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="p-live">Live URL</Label>
          <Input
            id="p-live"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ===== Experiences =====
const ExperiencesList = () => {
  const [items, setItems] = useState<ExperienceItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExperienceItem | null>(null);

  useEffect(() => {
    const qy = query(
      collection(db, "experiences"),
      orderBy("startDate", "desc")
    );
    const unsub = onSnapshot(qy, (snap) => {
      const next: ExperienceItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setItems(next);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this experience?")) return;
    await deleteDoc(doc(db, "experiences", id));
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Experiences</h2>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) setEditing(null);
            setOpen(v);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add experience
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit experience" : "New experience"}
              </DialogTitle>
            </DialogHeader>
            <ExperienceForm
              initial={editing || undefined}
              onCancel={() => {
                setOpen(false);
                setEditing(null);
              }}
              onSaved={() => {
                setOpen(false);
                setEditing(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {items.map((e) => (
          <div
            key={e.id}
            className="flex items-start justify-between rounded-2xl border p-4"
          >
            <div className="min-w-0">
              <h3 className="truncate text-lg font-medium">
                {e.role} @ {e.company}
              </h3>
              <div className="text-sm text-muted-foreground">
                {toISODateOrEmpty(e.startDate)} –{" "}
                {e.endDate ? toISODateOrEmpty(e.endDate) : "Present"}
              </div>
              {e.location ? (
                <div className="text-xs text-muted-foreground">
                  {e.location}
                </div>
              ) : null}
              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {e.summary}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {arrayToCsv(e.tags)}
              </div>
            </div>
            <div className="ml-4 shrink-0 space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditing(e);
                  setOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(e.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">
            No experiences yet.
          </div>
        )}
      </div>
    </section>
  );
};

function ExperienceForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: ExperienceItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [company, setCompany] = useState(initial?.company || "");
  const [role, setRole] = useState(initial?.role || "");
  const [startDate, setStartDate] = useState(
    toISODateOrEmpty(initial?.startDate) || ""
  );
  const [endDate, setEndDate] = useState(
    toISODateOrEmpty(initial?.endDate) || ""
  );
  const [location, setLocation] = useState(initial?.location || "");
  const [summary, setSummary] = useState(initial?.summary || "");
  const [logo, setLogo] = useState(initial?.logo || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [tagsCsv, setTagsCsv] = useState(arrayToCsv(initial?.tags));
  const [url, setUrl] = useState(initial?.url || "");
  const [imagesTxt, setImagesTxt] = useState(arrayToTextblock(initial?.images));
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (initial?.id) {
        const id = initial.id;
        let logoUrl = logo;
        if (logoFile) logoUrl = await uploadOne(logoFile, id);
        let imgUrls: string[] = textblockToArray(imagesTxt);
        if (imageFiles.length) {
          const uploaded = await uploadMany(imageFiles, id);
          imgUrls = [...imgUrls, ...uploaded];
        }
        const payload: Omit<ExperienceItem, "id"> = replaceUndefinedWithEmpty({
          company,
          role,
          startDate: startDate || new Date().toISOString().slice(0, 10),
          endDate,
          location,
          summary,
          logo: logoUrl,
          tags: csvToArray(tagsCsv),
          url,
          images: imgUrls,
        });
        await updateDocClean(doc(db, "experiences", id), payload as any);
      } else {
        const id = genId();
        let logoUrl = logo;
        if (logoFile) logoUrl = await uploadOne(logoFile, id);
        let imgUrls = textblockToArray(imagesTxt);
        if (imageFiles.length)
          imgUrls = [...imgUrls, ...(await uploadMany(imageFiles, id))];
        const payload: Omit<ExperienceItem, "id"> = replaceUndefinedWithEmpty({
          company,
          role,
          startDate: startDate || new Date().toISOString().slice(0, 10),
          endDate,
          location,
          summary,
          logo: logoUrl,
          tags: csvToArray(tagsCsv),
          url,
          images: imgUrls,
        });
        await setDocClean(doc(db, "experiences", id), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="e-company">Company</Label>
          <Input
            id="e-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="e-role">Role</Label>
          <Input
            id="e-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="e-start">Start date</Label>
          <Input
            id="e-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="e-end">End date</Label>
          <Input
            id="e-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Leave empty if Present
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="e-location">Location</Label>
          <Input
            id="e-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="e-logo">Logo URL (or upload below)</Label>
          <Input
            id="e-logo"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="https://..."
          />
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-muted-foreground">
            Uploads go to <code>public/assets/&lt;id&gt;/</code>. File upload
            wins over URL.
          </p>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="e-summary">Summary</Label>
        <Textarea
          id="e-summary"
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="e-tags">Tags (comma-separated)</Label>
        <Input
          id="e-tags"
          value={tagsCsv}
          onChange={(e) => setTagsCsv(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="e-url">URL</Label>
        <Input
          id="e-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="e-images">Additional image URLs (one per line)</Label>
        <Textarea
          id="e-images"
          rows={4}
          value={imagesTxt}
          onChange={(e) => setImagesTxt(e.target.value)}
          placeholder="https://...
https://..."
        />
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
        />
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ===== News =====
const NewsList = () => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);

  useEffect(() => {
    const qy = query(collection(db, "news"), orderBy("publishedAt", "desc"));
    const unsub = onSnapshot(qy, (snap) => {
      const next: NewsItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setItems(next);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this news item?")) return;
    await deleteDoc(doc(db, "news", id));
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">News</h2>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) setEditing(null);
            setOpen(v);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add news
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit news" : "New news"}</DialogTitle>
            </DialogHeader>
            <NewsForm
              initial={editing || undefined}
              onCancel={() => {
                setOpen(false);
                setEditing(null);
              }}
              onSaved={() => {
                setOpen(false);
                setEditing(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {items.map((n) => (
          <div
            key={n.id}
            className="flex items-start justify-between rounded-2xl border p-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {n.pinned ? (
                  <span className="rounded bg-yellow-200/60 px-2 py-0.5 text-xs font-medium text-yellow-900">
                    Pinned
                  </span>
                ) : null}
                {n.draft ? (
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-900">
                    Draft
                  </span>
                ) : null}
              </div>
              <h3 className="truncate text-lg font-medium">{n.title}</h3>
              <div className="text-sm text-muted-foreground">
                {toISODateOrEmpty(n.publishedAt)}
              </div>
              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {n.content}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {arrayToCsv(n.tags)}
              </div>
            </div>
            <div className="ml-4 shrink-0 space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditing(n);
                  setOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(n.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">
            No news yet.
          </div>
        )}
      </div>
    </section>
  );
};

function NewsForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: NewsItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [publishedAt, setPublishedAt] = useState(
    toISODateOrEmpty(initial?.publishedAt) ||
      toISODateOrEmpty(new Date().toISOString())
  );
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [imagesTxt, setImagesTxt] = useState(
    imagesJsonToTextblock(initial?.images)
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [tagsCsv, setTagsCsv] = useState(arrayToCsv(initial?.tags));
  const [url, setUrl] = useState(initial?.url || "");
  const [draft, setDraft] = useState(!!initial?.draft);
  const [pinned, setPinned] = useState(!!initial?.pinned);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (initial?.id) {
        const id = initial.id;
        let coverUrl = coverImage;
        if (coverFile) coverUrl = await uploadOne(coverFile, id);
        let imgs = textblockToImagesJson(imagesTxt);
        if (imageFiles.length) {
          const uploaded = await uploadMany(imageFiles, id);
          imgs = [...imgs, ...uploaded.map((src) => ({ src, alt: "" }))];
        }
        const payload: Omit<NewsItem, "id"> = replaceUndefinedWithEmpty({
          title,
          content,
          publishedAt: publishedAt || new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString(),
          coverImage: coverUrl,
          images: imgs,
          tags: csvToArray(tagsCsv),
          url,
          draft,
          pinned,
        });
        await updateDocClean(doc(db, "news", id), payload as any);
      } else {
        const id = genId();
        let coverUrl = coverImage;
        if (coverFile) coverUrl = await uploadOne(coverFile, id);
        let imgs = textblockToImagesJson(imagesTxt);
        if (imageFiles.length) {
          const uploaded = await uploadMany(imageFiles, id);
          imgs = [...imgs, ...uploaded.map((src) => ({ src, alt: "" }))];
        }
        const payload: Omit<NewsItem, "id"> = replaceUndefinedWithEmpty({
          title,
          content,
          publishedAt: publishedAt || new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString(),
          coverImage: coverUrl,
          images: imgs,
          tags: csvToArray(tagsCsv),
          url,
          draft,
          pinned,
        });
        await setDocClean(doc(db, "news", id), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="n-title">Title</Label>
        <Input
          id="n-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="n-content">Content</Label>
        <Textarea
          id="n-content"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="n-date">Published date</Label>
          <Input
            id="n-date"
            type="date"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="n-cover">Cover image URL (or upload below)</Label>
          <Input
            id="n-cover"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
          />
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-muted-foreground">
            Uploads go to <code>public/assets/&lt;id&gt;/</code>. File upload
            wins over URL.
          </p>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="n-images">
          Additional images (one per line, optional ` | alt`) or upload below
        </Label>
        <Textarea
          id="n-images"
          rows={4}
          value={imagesTxt}
          onChange={(e) => setImagesTxt(e.target.value)}
          placeholder="https://... | optional alt
https://..."
        />
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="n-tags">Tags (comma-separated)</Label>
        <Input
          id="n-tags"
          value={tagsCsv}
          onChange={(e) => setTagsCsv(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="n-url">Link URL (optional)</Label>
        <Input
          id="n-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="n-draft"
            checked={draft}
            onCheckedChange={(v) => setDraft(!!v)}
          />
          <Label htmlFor="n-draft">Draft</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="n-pin"
            checked={pinned}
            onCheckedChange={(v) => setPinned(!!v)}
          />
          <Label htmlFor="n-pin">Pinned</Label>
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </div>
  );
}
