"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/types";

interface Props {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}

const EMOJIS = ["📋", "📁", "🎯", "🚀", "💡", "🔧", "🎨", "📊", "📝", "🏆", "💻", "🔬", "🎵", "📱", "🌟", "⚡", "🎮", "📚", "🔑", "✅"];
const COLORS = ["#FEF3A0", "#FAD9C4", "#FADADD", "#F9C6E0", "#E3DAFC", "#BFE3FA", "#C6E0FA", "#C8EBC6", "#D4F0E0", "#D0EDE8", "#F0E8D0", "#E8D5C4", "#D4D4F0", "#E8E8E8", "#F5E6D0"];

export default function EditProjectModal({ project, onClose, onSuccess }: Props) {
  const [name, setName] = useState(project.name);
  const [dueDate, setDueDate] = useState(project.due_date ?? "");
  const [emoji, setEmoji] = useState(project.emoji ?? "📋");
  const [color, setColor] = useState(project.color ?? "#E8E8E8");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .update({
        name: name.trim(),
        due_date: dueDate || null,
        emoji,
        color,
      })
      .eq("id", project.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    onSuccess();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4"
      style={{ backgroundColor: "rgba(28,25,23,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex flex-col w-full h-full sm:h-auto sm:max-w-sm bg-white dark:bg-stone-900 sm:rounded-2xl shadow-xl border-0 sm:border sm:border-stone-100 dark:sm:border-stone-700 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100 dark:border-stone-700">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200">Edit project</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="edit-project-name" className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Project name
              </label>
              <input
                ref={nameRef}
                id="edit-project-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700 transition"
              />
            </div>

            {/* Emoji */}
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Icon
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all"
                    style={{
                      background: emoji === e ? (color + "66") : "transparent",
                      outline: emoji === e ? `2px solid ${color === "#E8E8E8" ? "#a8a29e" : color}` : "2px solid transparent",
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Color
              </span>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      outline: color === c ? "2px solid #78716c" : "2px solid transparent",
                      outlineOffset: "2px",
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <label htmlFor="edit-project-due" className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Due date <span className="normal-case font-normal">(optional)</span>
              </label>
              <input
                id="edit-project-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-lg px-3.5 py-2.5">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-stone-200 dark:border-stone-600 px-4 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 rounded-lg bg-stone-800 dark:bg-stone-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 dark:hover:bg-stone-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
