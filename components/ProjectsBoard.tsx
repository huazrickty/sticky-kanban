"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types";
import type { ProjectWithStats } from "@/app/(board)/projects/page";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "./ThemeProvider";
import AddProjectModal from "./AddProjectModal";
import EditProjectModal from "./EditProjectModal";
import EditProfileModal from "./EditProfileModal";
import CircularProgress from "./CircularProgress";

interface Props {
  initialProjects: ProjectWithStats[];
  userId: string;
  userEmail: string;
  displayName: string | null;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function progressColor(pct: number): string {
  if (pct === 0) return "#a8a29e";
  if (pct < 50) return "#F0A500";
  if (pct < 100) return "#3B8BD4";
  return "#3aaa5c";
}

interface ProjectCardProps {
  project: ProjectWithStats;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

function ProjectCard({ project, onEdit, onDelete, onClick }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const overdue = isOverdue(project.due_date);
  const { total, completed, percentage } = project;

  const cardColor = project.color ?? "#E8E8E8";
  const cardEmoji = project.emoji ?? "📋";

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 flex flex-col overflow-hidden"
      style={{ borderLeft: `4px solid ${cardColor}` }}
    >
      {/* Top row: left info + right (circle + menu) */}
      <div
        className="flex items-start justify-between gap-3 p-5"
        style={{ backgroundColor: cardColor + "22" }}
      >

        {/* Left: emoji + name, due date, task count */}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "28px", lineHeight: 1 }}>{cardEmoji}</span>
            <h3 className="text-base font-semibold text-stone-800 dark:text-stone-100 leading-snug">
              {project.name}
            </h3>
          </div>

          {project.due_date && (
            <div className="flex items-center gap-1.5">
              <svg
                className={["w-3.5 h-3.5 shrink-0", overdue ? "text-red-400" : "text-stone-400 dark:text-stone-500"].join(" ")}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span className={["text-xs font-medium", overdue ? "text-red-500" : "text-stone-500 dark:text-stone-400"].join(" ")}>
                {overdue ? `Overdue · ${formatDate(project.due_date)}` : formatDate(project.due_date)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 mt-1">
            {total === 0 ? (
              <span className="text-xs text-stone-400 dark:text-stone-500 italic">No tasks yet</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
                <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                  {completed} / {total} done
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: circular progress + three-dot menu */}
        <div
          className="flex items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <CircularProgress percentage={percentage} size={56} strokeWidth={5} />

          {/* Three-dot menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className={[
                "w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 dark:text-stone-500",
                "opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-100",
                "hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-600 dark:hover:text-stone-300",
                menuOpen && "md:opacity-100 bg-stone-100 dark:bg-stone-700",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label="Project options"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-100 dark:border-stone-700 py-1 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { setMenuOpen(false); onEdit(); }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-stone-600 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: progress bar — only when there are tasks */}
      {total > 0 && (
        <div className="mt-1 px-5 pb-5">
          <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-700/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: progressColor(percentage),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsBoard({
  initialProjects,
  userId,
  userEmail,
  displayName: initialDisplayName,
}: Props) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [projects, setProjects] = useState<ProjectWithStats[]>(initialProjects);
  const [displayName, setDisplayName] = useState<string | null>(initialDisplayName);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const visibleName = displayName || userEmail;
  const avatarLetter = (displayName || userEmail).charAt(0).toUpperCase();

  async function refreshProjects() {
    const supabase = createClient();
    const [{ data: projectRows }, { data: taskRows }] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("project_id, status")
        .eq("user_id", userId),
    ]);

    const enriched: ProjectWithStats[] = (projectRows ?? []).map((project) => {
      const projectTasks = (taskRows ?? []).filter((t) => t.project_id === project.id);
      const total = projectTasks.length;
      const completed = projectTasks.filter((t) => t.status === "done").length;
      const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
      return { ...project, total, completed, percentage };
    });

    setProjects(enriched);
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleDelete(project: ProjectWithStats) {
    const confirmed = window.confirm(
      `Delete "${project.name}"? All tasks in this project will also be deleted.`
    );
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f0ede8] dark:bg-stone-900">
      {/* Navbar */}
      <header className="shrink-0 bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-500 dark:text-stone-400 tracking-tight">
          Sticky Board
        </span>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 border-b border-stone-700 dark:border-stone-200 pb-0.5">
            Projects
          </span>
          <button
            onClick={() => router.push("/categories")}
            className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
            title="Categories"
            aria-label="Categories"
          >
            <svg className="w-4 h-4 md:hidden" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span className="hidden md:inline text-xs font-medium">Categories</span>
          </button>

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

          {/* Avatar + name */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Edit profile"
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
              style={{ backgroundColor: "#78716c" }}
            >
              {avatarLetter}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block max-w-32 truncate">
              {visibleName}
            </span>
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loggingOut ? "Signing out…" : "Logout"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 py-8 max-w-6xl w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-base font-semibold text-stone-700 dark:text-stone-200">
            My Projects
            <span className="ml-2 text-xs font-normal text-stone-400 dark:text-stone-500">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </span>
          </h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-stone-800 dark:bg-stone-700 hover:bg-stone-700 dark:hover:bg-stone-600 px-3.5 py-2 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 select-none">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
              <rect x="6" y="8" width="44" height="40" rx="4" fill="#e7e3dd" />
              <rect x="6" y="8" width="44" height="10" rx="4" fill="#d4cfc8" />
              <line x1="14" y1="28" x2="34" y2="28" stroke="#c5c0b8" strokeWidth="2" strokeLinecap="round" />
              <line x1="14" y1="35" x2="28" y2="35" stroke="#c5c0b8" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">No projects yet</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Create your first project to get started</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 text-xs font-medium text-white bg-stone-800 dark:bg-stone-700 hover:bg-stone-700 dark:hover:bg-stone-600 px-4 py-2 rounded-lg transition-colors"
            >
              Create a project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/projects/${project.id}`)}
                onEdit={() => setEditTarget(project)}
                onDelete={() => handleDelete(project)}
              />
            ))}
          </div>
        )}
      </main>

      {isAddModalOpen && (
        <AddProjectModal
          userId={userId}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            refreshProjects();
          }}
        />
      )}

      {editTarget && (
        <EditProjectModal
          project={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setEditTarget(null);
            refreshProjects();
          }}
        />
      )}

      {isProfileModalOpen && (
        <EditProfileModal
          userId={userId}
          onClose={() => setIsProfileModalOpen(false)}
          onSuccess={(name) => {
            setDisplayName(name || null);
            setIsProfileModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
