"use client";

import { useEffect, useRef, useState } from "react";
import type { Category } from "@/types";
import { createClient } from "@/lib/supabase/client";

const COLORS = [
  "#FEF3A0", "#FAD9C4", "#FADADD", "#F9C6E0",
  "#E3DAFC", "#BFE3FA", "#C6E0FA", "#C8EBC6",
  "#D4F0E0", "#D0EDE8", "#F0E8D0", "#E8D5C4",
  "#D4D4F0", "#E8E8E8", "#F5E6D0",
];

interface Props {
  category?: Category;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryModal({ category, userId, onClose, onSuccess }: Props) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? COLORS[0]);
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
    const { error } = isEdit
      ? await supabase
          .from("categories")
          .update({ name: name.trim(), color })
          .eq("id", category.id)
      : await supabase
          .from("categories")
          .insert({ user_id: userId, name: name.trim(), color });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    onSuccess();
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
          <h2 className="text-sm font-semibold text-stone-700">
            {isEdit ? "Edit category" : "New category"}
          </h2>
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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="cat-name" className="block text-xs font-medium text-stone-500 uppercase tracking-wide">
              Name
            </label>
            <input
              ref={nameRef}
              id="cat-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition"
            />
          </div>

          {/* Color swatches */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide">
              Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className="relative w-9 h-9 rounded-lg transition-transform duration-100 hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <>
                      <span className="absolute inset-0 rounded-lg ring-2 ring-offset-1 ring-stone-600 pointer-events-none" />
                      <svg
                        className="absolute inset-0 m-auto w-4 h-4 text-stone-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </>
                  )}
                </button>
              ))}
            </div>
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
              disabled={loading || !name.trim()}
              className="flex-1 rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
