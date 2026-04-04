"use client";

import { useEffect, useRef, useState } from "react";
import type { Task, Category } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface Props {
  task: Task;
  categories: Category[];
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
}

export default function EditTaskModal({ task, categories, onClose, onTaskUpdated }: Props) {
  const [title, setTitle] = useState(task.title);
  const [categoryId, setCategoryId] = useState<string>(task.category_id ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("tasks")
      .update({
        title: title.trim(),
        category_id: categoryId || null,
        due_date: dueDate || null,
      })
      .eq("id", task.id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    onTaskUpdated(data as Task);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(28,25,23,0.35)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-700">Edit task</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="edit-title" className="block text-xs font-medium text-stone-500 uppercase tracking-wide">
              Title
            </label>
            <input
              ref={titleRef}
              id="edit-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="edit-category" className="block text-xs font-medium text-stone-500 uppercase tracking-wide">
              Category
            </label>
            <div className="relative">
              <select
                id="edit-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition pr-8"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <label htmlFor="edit-due" className="block text-xs font-medium text-stone-500 uppercase tracking-wide">
              Due date <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              id="edit-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
