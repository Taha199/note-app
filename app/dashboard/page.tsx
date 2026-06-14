"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import type { Note, NoteStyle } from "@/types/note";

type ActiveView = "home" | "oldNotes" | "favorites" | "archive" | "settings";

type NoteFormState = {
  content: string;
  style: NoteStyle;
};

const emptyForm: NoteFormState = {
  content: "",
  style: {
    color: "#18181b",
    fontFamily: "Inter",
    fontSize: "16",
    bold: false,
    italic: false,
    underline: false,
    align: "left"
  }
};

const colorOptions = ["#18181b", "#0f766e", "#1d4ed8", "#7c3aed", "#be123c"];
const fontOptions = ["Inter", "Georgia", "Arial", "Courier New"];
const sizeOptions = ["14", "16", "18", "20", "24"];

function DashboardContent() {
  const { user, logOut } = useAuth();
  const accountLabel = user?.email ?? "Password access";
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [form, setForm] = useState<NoteFormState>(emptyForm);
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const notesCollection = useMemo(() => {
    if (!user) {
      return null;
    }

    return collection(db, "users", user.uid, "notes");
  }, [user]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId]
  );

  const activeNotes = useMemo(
    () => notes.filter((note) => !note.archived),
    [notes]
  );

  const archivedNotes = useMemo(
    () => notes.filter((note) => note.archived),
    [notes]
  );

  const favoriteNotes = useMemo(
    () => notes.filter((note) => note.favorite && !note.archived),
    [notes]
  );

  useEffect(() => {
    if (!notesCollection) {
      return;
    }

    setLoadingNotes(true);
    const notesQuery = query(notesCollection, orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(
      notesQuery,
      (snapshot) => {
        const nextNotes = snapshot.docs.map((noteDoc) => ({
          id: noteDoc.id,
          ...noteDoc.data()
        })) as Note[];
        setNotes(nextNotes);
        setLoadingNotes(false);
      },
      () => {
        setError("Could not load notes. Check your Firebase rules and connection.");
        setLoadingNotes(false);
      }
    );

    return unsubscribe;
  }, [notesCollection]);

  function startNewNote() {
    setSelectedNoteId(null);
    setForm(emptyForm);
    setActiveView("home");
    setError("");
  }

  function startEditing(note: Note) {
    setSelectedNoteId(note.id);
    setForm({
      content: note.content,
      style: {
        ...emptyForm.style,
        ...note.style
      }
    });
    setActiveView("home");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!notesCollection || !user) {
      return;
    }

    const content = form.content.trim();
    const title = getNoteTitle(content);

    if (!content) {
      setError("Write something before saving.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (selectedNoteId) {
        await updateDoc(doc(db, "users", user.uid, "notes", selectedNoteId), {
          title,
          content,
          style: form.style,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(notesCollection, {
          title,
          content,
          style: form.style,
          archived: false,
          favorite: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      startNewNote();
    } catch {
      setError("Could not save this note. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId: string) {
    if (!user) {
      return;
    }

    const confirmed = window.confirm("Delete this note? This cannot be undone.");

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteDoc(doc(db, "users", user.uid, "notes", noteId));
      if (selectedNoteId === noteId) {
        startNewNote();
      }
    } catch {
      setError("Could not delete this note. Please try again.");
    }
  }

  async function handleArchive(noteId: string) {
    if (!user) {
      return;
    }

    setError("");

    try {
      await updateDoc(doc(db, "users", user.uid, "notes", noteId), {
        archived: true,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (selectedNoteId === noteId) {
        startNewNote();
      }
    } catch {
      setError("Could not archive this note. Please try again.");
    }
  }

  async function handleRestore(noteId: string) {
    if (!user) {
      return;
    }

    setError("");

    try {
      await updateDoc(doc(db, "users", user.uid, "notes", noteId), {
        archived: false,
        archivedAt: null,
        updatedAt: serverTimestamp()
      });
      setActiveView("oldNotes");
    } catch {
      setError("Could not restore this note. Please try again.");
    }
  }

  async function handleToggleFavorite(note: Note) {
    if (!user) {
      return;
    }

    setError("");

    try {
      await updateDoc(doc(db, "users", user.uid, "notes", note.id), {
        favorite: !note.favorite,
        updatedAt: serverTimestamp()
      });
    } catch {
      setError("Could not update favorite status. Please try again.");
    }
  }

  async function handleLogout() {
    await logOut();
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6">
      <div
        className={
          sidebarOpen
            ? "mx-auto grid max-w-7xl gap-5 md:grid-cols-[17rem_minmax(0,1fr)]"
            : "mx-auto grid max-w-7xl gap-5"
        }
      >
        {sidebarOpen ? (
          <aside className="rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-[0_18px_60px_rgba(24,24,27,0.08)] md:sticky md:top-5 md:self-start">
            <div className="mb-4 flex items-center gap-3 border-b border-zinc-100 pb-4">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-zinc-950 text-sm font-bold text-white">
                N
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-zinc-950">
                  Hospital Notes
                </h1>
                <p className="truncate text-xs text-zinc-500">{accountLabel}</p>
              </div>
            </div>

            <nav className="space-y-2">
              <SidebarButton
                active={activeView === "home"}
                label="Home"
                count={null}
                onClick={() => setActiveView("home")}
              />
              <SidebarButton
                active={activeView === "oldNotes"}
                label="Old notes"
                count={activeNotes.length}
                onClick={() => setActiveView("oldNotes")}
              />
              <SidebarButton
                active={activeView === "favorites"}
                label="Favorites"
                count={favoriteNotes.length}
                onClick={() => setActiveView("favorites")}
              />
              <SidebarButton
                active={activeView === "archive"}
                label="Archive"
                count={archivedNotes.length}
                onClick={() => setActiveView("archive")}
              />
            </nav>

            <div className="mt-5 border-t border-zinc-100 pt-3">
              <SidebarButton
                active={activeView === "settings"}
                label="Settings"
                count={null}
                onClick={() => setActiveView("settings")}
              />
            </div>
          </aside>
        ) : null}

        <div>
        <header className="mb-5 flex items-center justify-between rounded-lg border border-zinc-200 bg-white/95 p-4 shadow-[0_18px_60px_rgba(24,24,27,0.08)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? "Hide menu" : "Show menu"}
            </button>
            <span className="grid h-10 w-10 place-items-center rounded-md bg-zinc-950 text-sm font-bold text-white">
              N
            </span>
            <div>
              <h1 className="text-lg font-semibold text-zinc-950">Hospital Notes</h1>
              <p className="text-sm text-zinc-500">{accountLabel}</p>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

          <section>
            {activeView === "home" ? (
              <div className="space-y-5">
                <NoteEditor
                  form={form}
                  selectedNote={selectedNote}
                  saving={saving}
                  onSubmit={handleSubmit}
                  onChangeForm={setForm}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onClear={startNewNote}
                  onToggleFavorite={handleToggleFavorite}
                />
                <NotesList
                  title="Favorites"
                  emptyTitle="No favorites yet"
                  emptyText="Mark an old note as favorite and it will appear here."
                  notes={favoriteNotes}
                  loading={loadingNotes}
                  selectedNoteId={selectedNoteId}
                  actionLabel="Remove favorite"
                  onOpen={startEditing}
                  onAction={(noteId) => {
                    const note = notes.find((item) => item.id === noteId);
                    return note ? handleToggleFavorite(note) : Promise.resolve();
                  }}
                  onFavorite={handleToggleFavorite}
                />
              </div>
            ) : null}

            {activeView === "oldNotes" ? (
              <NotesList
                title="Old notes"
                emptyTitle="No old notes yet"
                emptyText="Save your first note and it will appear here."
                notes={activeNotes}
                loading={loadingNotes}
                selectedNoteId={selectedNoteId}
                actionLabel="تمت المراجعة"
                onOpen={startEditing}
                onAction={handleArchive}
                onFavorite={handleToggleFavorite}
              />
            ) : null}

            {activeView === "favorites" ? (
              <NotesList
                title="Favorites"
                emptyTitle="No favorites yet"
                emptyText="Favorite notes will appear here and under the editor."
                notes={favoriteNotes}
                loading={loadingNotes}
                selectedNoteId={selectedNoteId}
                actionLabel="Remove favorite"
                onOpen={startEditing}
                onAction={(noteId) => {
                  const note = notes.find((item) => item.id === noteId);
                  return note ? handleToggleFavorite(note) : Promise.resolve();
                }}
                onFavorite={handleToggleFavorite}
              />
            ) : null}

            {activeView === "archive" ? (
              <NotesList
                title="Archive"
                emptyTitle="Archive is empty"
                emptyText="Reviewed notes will move here."
                notes={archivedNotes}
                loading={loadingNotes}
                selectedNoteId={selectedNoteId}
                actionLabel="Restore to old notes"
                onOpen={startEditing}
                onAction={handleRestore}
                onFavorite={handleToggleFavorite}
              />
            ) : null}

            {activeView === "settings" ? (
              <SettingsPanel
                email={accountLabel}
                uid={user?.uid ?? ""}
                notesCount={activeNotes.length}
                onLogout={handleLogout}
              />
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function SidebarButton({
  active,
  label,
  count,
  onClick
}: {
  active: boolean;
  label: string;
  count: number | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold transition ${
        active
          ? "bg-zinc-950 text-white"
          : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
      }`}
    >
      <span>{label}</span>
      {count !== null ? (
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            active ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function NoteEditor({
  form,
  selectedNote,
  saving,
  onSubmit,
  onChangeForm,
  onArchive,
  onDelete,
  onClear,
  onToggleFavorite
}: {
  form: NoteFormState;
  selectedNote: Note | null;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChangeForm: (form: NoteFormState) => void;
  onArchive: (noteId: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  onClear: () => void;
  onToggleFavorite: (note: Note) => Promise<void>;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-zinc-200 bg-white/95 shadow-[0_18px_60px_rgba(24,24,27,0.08)]"
    >
      <div className="flex items-center justify-between border-b border-zinc-100 p-4">
        <div>
          <p className="text-sm text-zinc-500">
            {selectedNote ? "Editing note" : "New note"}
          </p>
          <h2 className="text-lg font-semibold text-zinc-950">
            {selectedNote
              ? selectedNote.title || getNoteTitle(selectedNote.content)
              : "New note"}
          </h2>
        </div>
        {selectedNote ? (
          <div className="flex flex-wrap gap-2">
            {!selectedNote.archived ? (
              <button
                type="button"
                onClick={() => onToggleFavorite(selectedNote)}
                className="rounded-md border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
              >
                {selectedNote.favorite ? "Remove favorite" : "Add favorite"}
              </button>
            ) : null}
            {!selectedNote.archived ? (
              <button
                type="button"
                onClick={() => onArchive(selectedNote.id)}
                className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                تمت مراجعة هذه الملحوظة
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onDelete(selectedNote.id)}
              className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <label className="block">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-zinc-700">Note</span>
            <span className="text-xs text-zinc-400">
              First line becomes the note name
            </span>
          </div>
          <EditorToolbar
            style={form.style}
            onChange={(style) =>
              onChangeForm({
                ...form,
                style: {
                  ...form.style,
                  ...style
                }
              })
            }
          />
          <textarea
            value={form.content}
            onChange={(event) =>
              onChangeForm({
                ...form,
                content: event.target.value
              })
            }
            rows={16}
            style={{
              color: form.style.color,
              fontFamily: form.style.fontFamily,
              fontSize: `${form.style.fontSize}px`,
              fontWeight: form.style.bold ? 700 : 400,
              fontStyle: form.style.italic ? "italic" : "normal",
              textDecoration: form.style.underline ? "underline" : "none",
              textAlign: form.style.align
            }}
            className="mt-0 w-full resize-y rounded-b-md border-zinc-300 bg-white px-3 py-3 leading-7 shadow-sm focus:border-zinc-900 focus:ring-zinc-900"
            placeholder="Write your note..."
          />
        </label>

        <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-400">Stored privately in your account.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClear}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : selectedNote ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function NotesList({
  title,
  emptyTitle,
  emptyText,
  notes,
  loading,
  selectedNoteId,
  actionLabel,
  onOpen,
  onAction,
  onFavorite
}: {
  title: string;
  emptyTitle: string;
  emptyText: string;
  notes: Note[];
  loading: boolean;
  selectedNoteId: string | null;
  actionLabel: string;
  onOpen: (note: Note) => void;
  onAction: (noteId: string) => Promise<void>;
  onFavorite: (note: Note) => Promise<void>;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white/95 shadow-[0_18px_60px_rgba(24,24,27,0.08)]">
      <div className="border-b border-zinc-100 p-4">
        <h2 className="font-semibold text-zinc-950">{title}</h2>
        <p className="text-sm text-zinc-500">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </p>
      </div>

      <div className="p-2">
        {loading ? (
          <LoadingSpinner label="Loading notes" />
        ) : notes.length === 0 ? (
          <div className="p-6 text-center">
            <h3 className="font-semibold text-zinc-950">{emptyTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{emptyText}</p>
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {notes.map((note) => (
              <article
                key={note.id}
                className={`rounded-md border p-3 transition ${
                  selectedNoteId === note.id
                    ? "border-zinc-950 bg-zinc-50"
                    : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onOpen(note)}
                  className="block w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-1 text-sm font-semibold text-zinc-950">
                        {note.title || getNoteTitle(note.content)}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">
                        {note.content}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {formatNoteDate(note.updatedAt)}
                    </span>
                  </div>
                </button>
                <div className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-zinc-500">
                    Added: {formatFullDate(note.createdAt)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!note.archived ? (
                      <button
                        type="button"
                        onClick={() => onFavorite(note)}
                        className="rounded-md border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                      >
                        {note.favorite ? "Favorite" : "Add favorite"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onAction(note.id)}
                      className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    >
                      {actionLabel}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EditorToolbar({
  style,
  onChange
}: {
  style: NoteStyle;
  onChange: (style: Partial<NoteStyle>) => void;
}) {
  return (
    <div className="rounded-t-md border border-b-0 border-zinc-300 bg-zinc-50 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={style.fontFamily}
          onChange={(event) => onChange({ fontFamily: event.target.value })}
          className="rounded-md border-zinc-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-zinc-700 focus:border-zinc-900 focus:ring-zinc-900"
          aria-label="Font"
        >
          {fontOptions.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>

        <select
          value={style.fontSize}
          onChange={(event) => onChange({ fontSize: event.target.value })}
          className="rounded-md border-zinc-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-zinc-700 focus:border-zinc-900 focus:ring-zinc-900"
          aria-label="Font size"
        >
          {sizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>

        <div className="flex rounded-md border border-zinc-300 bg-white p-1">
          <ToolbarButton
            active={style.bold}
            label="B"
            onClick={() => onChange({ bold: !style.bold })}
          />
          <ToolbarButton
            active={style.italic}
            label="I"
            onClick={() => onChange({ italic: !style.italic })}
            className="italic"
          />
          <ToolbarButton
            active={style.underline}
            label="U"
            onClick={() => onChange({ underline: !style.underline })}
            className="underline"
          />
        </div>

        <div className="flex rounded-md border border-zinc-300 bg-white p-1">
          {(["left", "center", "right"] as NoteStyle["align"][]).map((align) => (
            <ToolbarButton
              key={align}
              active={style.align === align}
              label={align === "left" ? "L" : align === "center" ? "C" : "R"}
              onClick={() => onChange({ align })}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ color })}
              className={`h-7 w-7 rounded-full border transition ${
                style.color === color
                  ? "border-zinc-950 ring-2 ring-zinc-950/15"
                  : "border-zinc-200"
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Use color ${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  label,
  onClick,
  className = ""
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-8 min-w-8 place-items-center rounded px-2 text-sm font-semibold transition ${
        active ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"
      } ${className}`}
    >
      {label}
    </button>
  );
}

function SettingsPanel({
  email,
  uid,
  notesCount,
  onLogout
}: {
  email: string;
  uid: string;
  notesCount: number;
  onLogout: () => Promise<void>;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white/95 p-5 shadow-[0_18px_60px_rgba(24,24,27,0.08)]">
      <div className="border-b border-zinc-100 pb-4">
        <h2 className="text-xl font-semibold text-zinc-950">Settings</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your app session and account details.
        </p>
      </div>

      <div className="divide-y divide-zinc-100">
        <SettingRow label="Account email" value={email} />
        <SettingRow label="User ID" value={uid} mono />
        <SettingRow label="Saved notes" value={notesCount.toString()} />
        <SettingRow label="Storage path" value="users/{uid}/notes" mono />
        <SettingRow label="Sync status" value="Cloud Firestore enabled" />
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-5 w-full rounded-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
      >
        Log out
      </button>
    </section>
  );
}

function SettingRow({
  label,
  value,
  mono = false
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p
        className={`break-all text-sm font-medium text-zinc-950 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function getNoteTitle(content: string) {
  const firstLine = content
    .split("\n")
    .find((line) => line.trim().length > 0)
    ?.trim();

  if (!firstLine) {
    return "Untitled note";
  }

  return firstLine.length > 48 ? `${firstLine.slice(0, 48)}...` : firstLine;
}

function formatNoteDate(timestamp: Note["updatedAt"]) {
  if (!timestamp) {
    return "Now";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(timestamp.toDate());
}

function formatFullDate(timestamp: Note["createdAt"]) {
  if (!timestamp) {
    return "Not available yet";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(timestamp.toDate());
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
