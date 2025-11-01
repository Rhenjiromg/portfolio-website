"use client";
import { useEffect, useState, useMemo } from "react";
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
  Timestamp,
  where,
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
import { ProjectItem } from "../types/project";
import { NewsItem } from "../types/news";
import { ExperienceItem } from "../types/experience";

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
  const [tab, setTab] = useState<
    "PROJECTS" | "EXPERIENCES" | "NEWS" | "MESSAGES"
  >("PROJECTS");

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
          <Button
            variant={tab === "MESSAGES" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("MESSAGES")}
          >
            Messages
          </Button>
        </div>

        {tab === "PROJECTS" && <ProjectsList />}
        {tab === "EXPERIENCES" && <ExperiencesList />}
        {tab === "NEWS" && <NewsList />}
        {tab === "MESSAGES" && <MessagesList />}
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
        ...(d.data() as unknown as Omit<ProjectItem, "id">),
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
  const [content, setContent] = useState(initial?.content || "");
  const [additionalInfo, setAdditionalInfo] = useState<
    { title: string; answer: string }[]
  >(initial?.additionalInfo || []);

  const addAI = () => {
    setAdditionalInfo((prev) => [...prev, { title: "", answer: "" }]);
  };

  const updateAI = (
    index: number,
    field: "title" | "answer",
    value: string
  ) => {
    setAdditionalInfo((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const deleteAI = (index: number) => {
    setAdditionalInfo((prev) => prev.filter((_, i) => i !== index));
  };

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
          content,
          additionalInfo,
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
          content,
          additionalInfo,
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
        <Label htmlFor="n-content">Content</Label>
        <Textarea
          id="n-content"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {/* Additional Info (expandable, editable, add/delete) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Additional info</Label>
          <Button type="button" variant="outline" onClick={addAI}>
            + Add item
          </Button>
        </div>

        {additionalInfo.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No items yet. Click <span className="font-medium">Add item</span> to
            create one.
          </p>
        ) : (
          <div className="space-y-2">
            {additionalInfo.map((ai, idx) => (
              <details key={idx} className="rounded-lg border">
                <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                  <span className="truncate">
                    {ai.title?.trim() ? ai.title : "Untitled item"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Click to expand
                  </span>
                </summary>
                <div className="p-4 space-y-3">
                  <div className="grid gap-2">
                    <Label htmlFor={`ai-title-${idx}`}>Title</Label>
                    <Input
                      id={`ai-title-${idx}`}
                      value={ai.title}
                      onChange={(e) => updateAI(idx, "title", e.target.value)}
                      placeholder="e.g., Tech stack"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`ai-answer-${idx}`}>Answer</Label>
                    <Textarea
                      id={`ai-answer-${idx}`}
                      rows={4}
                      value={ai.answer}
                      onChange={(e) => updateAI(idx, "answer", e.target.value)}
                      placeholder="Enter the details that expand under this title..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => deleteAI(idx)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
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
        ...(d.data() as NewsItem),
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

  // Cover image (URL or file)
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Secondary images: URLs as rows + optional files
  const [imagesList, setImagesList] = useState<string[]>(
    (initial?.images ?? []).map((x) => x.src)
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [tagsCsv, setTagsCsv] = useState(arrayToCsv(initial?.tags));
  const [url, setUrl] = useState(initial?.url || "");
  const [draft, setDraft] = useState(!!initial?.draft);
  const [pinned, setPinned] = useState(!!initial?.pinned);
  const [saving, setSaving] = useState(false);

  // URL rows helpers
  const addImageRow = () => setImagesList((arr) => [...arr, ""]);
  const removeImageRow = (idx: number) =>
    setImagesList((arr) => arr.filter((_, i) => i !== idx));
  const updateImageRow = (idx: number, v: string) =>
    setImagesList((arr) => arr.map((s, i) => (i === idx ? v : s)));

  const buildImagesArray = (id: string) => async () => {
    // From URL rows
    let imgs = imagesList
      .map((src) => src.trim())
      .filter(Boolean)
      .map((src) => ({ src, alt: "" as const }));

    // From uploaded files
    if (imageFiles.length) {
      const uploaded = await uploadMany(imageFiles, id);
      imgs = [...imgs, ...uploaded.map((src) => ({ src, alt: "" as const }))];
    }
    return imgs;
  };

  const save = async () => {
    setSaving(true);
    try {
      if (initial?.id) {
        const id = initial.id;

        // Cover
        let coverUrl = coverImage;
        if (coverFile) coverUrl = await uploadOne(coverFile, id);

        // Secondary imgs
        const imgs = await buildImagesArray(id)();

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

        // Cover
        let coverUrl = coverImage;
        if (coverFile) coverUrl = await uploadOne(coverFile, id);

        // Secondary imgs
        const imgs = await buildImagesArray(id)();

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

      {/* Secondary images */}
      <div className="grid gap-2">
        <Label>Secondary images</Label>

        {/* URL rows */}
        <div className="space-y-2">
          {imagesList.map((val, idx) => (
            <div className="flex gap-2" key={idx}>
              <Input
                placeholder="https://example.com/image.jpg"
                value={val}
                onChange={(e) => updateImageRow(idx, e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => removeImageRow(idx)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addImageRow}>
            + Add image URL
          </Button>
        </div>

        {/* OR upload multiple files */}
        <div className="pt-2">
          <Label htmlFor="n-images-upload" className="text-xs">
            Or upload one or more files
          </Label>
          <Input
            id="n-images-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
          />
          {imageFiles.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {imageFiles.length} file{imageFiles.length > 1 ? "s" : ""}{" "}
              selected – uploaded on save
            </p>
          )}
        </div>
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

import {
  Mail,
  Copy,
  ChevronDown,
  ChevronUp,
  Star,
  StarOff,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { MessageItem } from "../types/messages";
import { stringify } from "querystring";

type TabKey = "unread" | "read" | "starred" | "trash";

function toDate(val?: MessageItem["createdAt"]): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof (val as any).seconds === "number") {
    const s =
      (val as any).seconds * 1000 + Math.floor((val as any).nanoseconds / 1e6);
    return new Date(s);
  }
  return null;
}

function formatDate(d: Date | null) {
  if (!d) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function MessagesList() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<TabKey>("unread");

  // Subscribe based on active tab
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const base = collection(db, "messages");
    const constraints = [
      orderBy("createdAt", "desc"),
      ...(activeTab === "trash"
        ? [where("deleted", "==", true)]
        : [where("deleted", "==", false)]),
      ...(activeTab === "unread"
        ? [where("read", "==", false)]
        : activeTab === "read"
        ? [where("read", "==", true)]
        : activeTab === "starred"
        ? [where("starred", "==", true)]
        : []),
    ];

    const qy = query(base, ...constraints);
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const next: MessageItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<MessageItem, "id">),
        }));
        setMessages(next);
        setLoading(false);
      },
      (err) => {
        console.error("Messages subscribe error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [activeTab]);

  // Local search
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return messages;
    return messages.filter(
      (m) =>
        m.email?.toLowerCase().includes(t) ||
        m.content?.toLowerCase().includes(t)
    );
  }, [messages, search]);

  // Actions
  const toggle = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Clipboard error:", e);
    }
  };

  const markRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "messages", id), { read: true });
    } catch (e) {
      console.error("markRead error:", e);
    }
  };

  const toggleStar = async (id: string, current?: boolean) => {
    try {
      await updateDoc(doc(db, "messages", id), { starred: !current });
    } catch (e) {
      console.error("toggleStar error:", e);
    }
  };

  // Soft delete → moves to Trash
  const softDelete = async (id: string) => {
    try {
      await updateDoc(doc(db, "messages", id), {
        deleted: true,
        deletedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("softDelete error:", e);
    }
  };

  // Restore from Trash
  const restore = async (id: string) => {
    try {
      await updateDoc(doc(db, "messages", id), {
        deleted: false,
        deletedAt: null,
      });
    } catch (e) {
      console.error("restore error:", e);
    }
  };

  // Permanently delete
  const hardDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "messages", id));
    } catch (e) {
      console.error("hardDelete error:", e);
    }
  };

  // UI helpers
  const TabButton = ({ tab, label }: { tab: TabKey; label: string }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-opacity ${
        activeTab === tab ? "opacity-100" : "opacity-70 hover:opacity-100"
      }`}
      style={{
        backgroundColor: activeTab === tab ? "#bcb29e" : "transparent",
        border: activeTab === tab ? "none" : "1px solid rgba(188,178,158,0.6)",
        color: "#1f1f1f",
      }}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <div
          className="mb-4 h-10 w-full animate-pulse rounded"
          style={{ backgroundColor: "rgba(188,178,158,0.35)" }}
        />
        <div className="space-y-3">
          <div
            className="h-20 w-full animate-pulse rounded"
            style={{ backgroundColor: "rgba(188,178,158,0.35)" }}
          />
          <div
            className="h-20 w-full animate-pulse rounded"
            style={{ backgroundColor: "rgba(188,178,158,0.35)" }}
          />
          <div
            className="h-20 w-full animate-pulse rounded"
            style={{ backgroundColor: "rgba(188,178,158,0.35)" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-3xl px-4 sm:px-6">
      {/* Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TabButton tab="unread" label="Unread" />
        <TabButton tab="read" label="Read" />
        <TabButton tab="starred" label="Starred" />
        <TabButton tab="trash" label="Trash" />
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or message…"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
        />
      </div>

      {/* Empty */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            backgroundColor: "#fdf0d5",
            boxShadow: "0 1px 2px rgba(188,178,158,0.25)",
            borderColor: "rgba(188,178,158,0.35)",
            borderWidth: 1,
          }}
        >
          <p className="text-sm" style={{ color: "#6b5f49" }}>
            No messages found.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((m) => {
            const d = toDate(m.createdAt);
            const isOpen = !!expanded[m.id];
            const preview =
              m.content.length > 180 && !isOpen
                ? m.content.slice(0, 180) + "…"
                : m.content;

            return (
              <li
                key={m.id}
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: "#fdf0d5",
                  boxShadow: "0 1px 2px rgba(188,178,158,0.25)",
                  borderColor: "rgba(188,178,158,0.35)",
                  borderWidth: 1,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`mailto:${m.email}`}
                        className="inline-flex items-center gap-1 hover:underline"
                        style={{ color: "#bcb29e" }}
                        title={`Email ${m.email}`}
                      >
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{m.email}</span>
                      </a>
                      <button
                        onClick={() => copy(m.email)}
                        className="rounded-full border border-black/10 px-2 py-1 text-xs hover:bg-black/5"
                        title="Copy email"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      {/* Date */}
                      <span className="text-xs" style={{ color: "#6b5f49" }}>
                        {formatDate(d)}
                      </span>
                    </div>

                    {/* Content */}
                    <p
                      className="mt-2 whitespace-pre-wrap"
                      style={{ color: "#1f1f1f" }}
                    >
                      {preview}
                    </p>
                  </div>

                  {/* Right-side actions */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {/* Star toggle (not shown in Trash? You can allow it if you prefer) */}
                    {activeTab !== "trash" && (
                      <button
                        onClick={() => toggleStar(m.id, m.starred)}
                        className="rounded-full border border-black/10 px-2 py-1 text-xs hover:bg-black/5"
                        title={m.starred ? "Unstar" : "Star"}
                      >
                        {m.starred ? (
                          <Star
                            className="h-4 w-4"
                            fill="#bcb29e"
                            color="#bcb29e"
                          />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    {/* Mark read (only in Unread) */}
                    {activeTab === "unread" && (
                      <button
                        onClick={() => markRead(m.id)}
                        className="rounded-full border border-black/10 px-2 py-1 text-xs hover:bg-black/5"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}

                    {/* Soft delete (move to Trash) */}
                    {activeTab !== "trash" && (
                      <button
                        onClick={() => softDelete(m.id)}
                        className="rounded-full border border-black/10 px-2 py-1 text-xs hover:bg-black/5"
                        title="Delete (move to Trash)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    {/* Trash-only actions */}
                    {activeTab === "trash" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => restore(m.id)}
                          className="rounded-full border border-black/10 px-2 py-1 text-xs hover:bg-black/5"
                          title="Restore"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => hardDelete(m.id)}
                          className="rounded-full border border-black/10 px-2 py-1 text-xs hover:bg-black/5"
                          title="Delete permanently"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Expand / collapse for long content */}
                    {m.content.length > 180 && (
                      <button
                        onClick={() => toggle(m.id)}
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{ backgroundColor: "#bcb29e" }}
                        aria-expanded={isOpen}
                        aria-controls={`msg-${m.id}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {isOpen ? (
                            <>
                              Show less <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Read more <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Full content when expanded */}
                {m.content.length > 180 && isOpen && (
                  <div id={`msg-${m.id}`} className="mt-2">
                    <p
                      className="whitespace-pre-wrap"
                      style={{ color: "#1f1f1f" }}
                    >
                      {m.content}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
