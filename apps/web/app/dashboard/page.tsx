"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
import { postUserNote, getUserNotes } from "../lib/api";

type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export default function Home() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    const load = async () => {
      setLoading(true);
      try{
        const token = await getToken();
        if (!token) {
          setError("Failed to authenticate");
          return;
        }
        const resp = await getUserNotes(token);
        if (resp.success) setNotes(resp.data || []);
        else setError(resp.error || "Failed to load notes");
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load notes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isLoaded, getToken]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("Failed to authenticate");
        return;
      }
      const created = await postUserNote(token, title, content);
      if (!created.success) throw new Error(created.error || "Create failed");
      // refresh
      setTitle("");
      setContent("");
      const notesResp = await getUserNotes(token);
      if (notesResp.success) setNotes(notesResp.data || []);
      else setError(notesResp.error || "Failed to refresh notes");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to create note");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-6 border-b">
        <h1 className="text-2xl font-semibold">Snipnest — Notes</h1>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-zinc-600">{user.firstName || user.fullName}</span>
              <SignOutButton>
                <button className="px-3 py-1 bg-red-600 text-white rounded">Sign out</button>
              </SignOutButton>
            </>
          ) : (
            <SignInButton>
              <button className="px-3 py-1 bg-blue-600 text-white rounded">Sign in</button>
            </SignInButton>
          )}
        </div>
      </header>

      <main className="p-6 flex-1 max-w-4xl mx-auto w-full">
        <section className="mb-8">
          <h2 className="text-xl font-medium mb-2">Create a note</h2>
          <form onSubmit={addNote} className="space-y-3">
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <textarea
              placeholder="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 border rounded h-28"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded"
                disabled={!user}
              >
                Add note
              </button>
              {!user && <span className="text-sm text-zinc-500">Sign in to create notes</span>}
            </div>
            {error && <div className="text-red-600">{error}</div>}
          </form>
        </section>

        <section>
          <h2 className="text-xl font-medium mb-4">Your notes</h2>
          {loading ? (
            <div>Loading...</div>
          ) : notes.length === 0 ? (
            <div className="text-zinc-500">No notes yet.</div>
          ) : (
            <ul className="space-y-4">
              {notes.map((n) => (
                <li key={n.id} className="p-4 border rounded">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold">{n.title}</h3>
                    <span className="text-sm text-zinc-500">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-700">{n.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
