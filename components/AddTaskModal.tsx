"use client";

import { useEffect, useRef, useState } from "react";
import type { Task, Category } from "@/types";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS: { value: Task["status"]; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "ongoing", label: "Ongoing" },
  { value: "done", label: "Done" },
];

interface Props {
  defaultStatus: Task["status"];
  categories: Category[];
  userId: string;
  projectId: string;
  onClose: () => void;
  onTaskAdded: (task: Task) => void;
}

export default function AddTaskModal({
  defaultStatus,
  categories,
  userId,
  projectId,
  onClose,
  onTaskAdded,
}: Props) {
  const [status, setStatus] = useState<Task["status"]>(defaultStatus);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
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
      .insert({
        user_id: userId,
        project_id: projectId,
        category_id: categoryId || null,
        title: title.trim(),
        status: status,
        due_date: dueDate || null,
        position: Math.floor(Date.now() / 1000),
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    onTaskAdded(data as Task);
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
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200">New task</h2>
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

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Status
              </label>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={[
                      "flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
                      status === value
                        ? "bg-stone-800 dark:bg-stone-700 text-white"
                        : "border border-stone-200 dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-500 hover:text-stone-700 dark:hover:text-stone-200",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="task-title" className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Title
              </label>
              <input
                ref={titleRef}
                id="task-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700 transition"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label htmlFor="task-category" className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Category
              </label>
              <div className="relative">
                <select
                  id="task-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700 transition pr-8"
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
              <label htmlFor="task-due" className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Due date <span className="normal-case font-normal">(optional)</span>
              </label>
              <input
                id="task-due"
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
                disabled={loading || !title.trim()}
                className="flex-1 rounded-lg bg-stone-800 dark:bg-stone-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 dark:hover:bg-stone-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Adding…" : "Add task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
