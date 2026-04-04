"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";
import CategoryModal from "@/components/CategoryModal";
import { useTheme } from "@/components/ThemeProvider";

export default function CategoriesPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<Category | "new" | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? "");

      const [{ data: cats }, { data: profile }] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
        supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single(),
      ]);

      setCategories(cats ?? []);
      setDisplayName(profile?.display_name ?? null);
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleDelete(cat: Category) {
    const confirmed = window.confirm(
      `Delete "${cat.name}"? Tasks in this category will become uncategorised.`
    );
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    }
  }

  async function handleModalSuccess() {
    setModalTarget(null);
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });
    setCategories(data ?? []);
  }

  const visibleName = displayName || userEmail;
  const avatarLetter = visibleName ? visibleName.charAt(0).toUpperCase() : "?";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0ede8] dark:bg-stone-900 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-600 dark:border-t-stone-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f0ede8] dark:bg-stone-900">
      {/* Navbar */}
      <header className="shrink-0 bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-500 dark:text-stone-400 tracking-tight">
          Sticky Board
        </span>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/projects")}
            className="text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
          >
            Projects
          </button>
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 border-b border-stone-700 dark:border-stone-200 pb-0.5">
            Categories
          </span>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          {/* Avatar + display name */}
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
              style={{ backgroundColor: "#78716c" }}
            >
              {avatarLetter}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block max-w-32 truncate">
              {visibleName}
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loggingOut ? "Signing out…" : "Logout"}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-8 py-8 max-w-4xl w-full mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-base font-semibold text-stone-700 dark:text-stone-200">
            Categories
            <span className="ml-2 text-xs font-normal text-stone-400 dark:text-stone-500">
              {categories.length} total
            </span>
          </h1>
          <button
            onClick={() => setModalTarget("new")}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-stone-800 hover:bg-stone-700 px-3.5 py-2 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New category
          </button>
        </div>

        {/* Grid */}
        {categories.length === 0 ? (
          <div className="text-center py-20 text-stone-400 dark:text-stone-500 text-sm">
            No categories yet — create one to start organising your tasks.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-3.5 flex items-center gap-3 shadow-sm"
              >
                {/* Color swatch */}
                <span
                  className="w-8 h-8 rounded-lg shrink-0"
                  style={{ backgroundColor: cat.color }}
                />

                {/* Name */}
                <span className="flex-1 text-sm font-medium text-stone-700 dark:text-stone-200 truncate">
                  {cat.name}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => setModalTarget(cat)}
                    aria-label="Edit"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    aria-label="Delete"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Category modal */}
      {modalTarget !== null && userId && (
        <CategoryModal
          category={modalTarget === "new" ? undefined : modalTarget}
          userId={userId}
          onClose={() => setModalTarget(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
