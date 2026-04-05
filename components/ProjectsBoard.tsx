"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import type { Project } from "@/types";
import type { ProjectWithStats } from "@/app/(board)/projects/page";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "./ThemeProvider";
import AddProjectModal from "./AddProjectModal";
import EditProjectModal from "./EditProjectModal";
import EditProfileModal from "./EditProfileModal";
import SortableProjectCard from "./SortableProjectCard";
import ArchivedProjectCard from "./ArchivedProjectCard";
import Toast from "./Toast";

interface Props {
  initialProjects: ProjectWithStats[];
  userId: string;
  userEmail: string;
  displayName: string | null;
  initialArchivedCount: number;
}

export default function ProjectsBoard({
  initialProjects,
  userId,
  userEmail,
  displayName: initialDisplayName,
  initialArchivedCount,
}: Props) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [projects, setProjects] = useState<ProjectWithStats[]>(initialProjects);
  const [archivedProjects, setArchivedProjects] = useState<ProjectWithStats[]>([]);
  const [archivedCount, setArchivedCount] = useState(initialArchivedCount);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(initialDisplayName);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const visibleName = displayName || userEmail;
  const avatarLetter = (displayName || userEmail).charAt(0).toUpperCase();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 8 } })
  );

  function showToast(message: string, type: "success" | "info" = "success") {
    setToast({ message, type });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(projects, oldIndex, newIndex);
    setProjects(reordered);

    const supabase = createClient();
    reordered.forEach((project, index) => {
      supabase.from("projects").update({ position: index }).eq("id", project.id);
    });
  }

  async function fetchArchivedProjects() {
    setArchivedLoading(true);
    const supabase = createClient();
    const [{ data: projectRows }, { data: taskRows }] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .eq("archived", true)
        .order("position", { ascending: true }),
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

    setArchivedProjects(enriched);
    setArchivedCount(enriched.length);
    setArchivedLoading(false);
  }

  async function toggleShowArchived() {
    if (!showArchived) {
      await fetchArchivedProjects();
      setShowArchived(true);
    } else {
      setShowArchived(false);
    }
  }

  async function refreshProjects() {
    const supabase = createClient();
    const [{ data: projectRows }, { data: taskRows }] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .eq("archived", false)
        .order("position", { ascending: true }),
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

  async function handleArchive(project: ProjectWithStats) {
    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .update({ archived: true })
      .eq("id", project.id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      setArchivedCount((c) => c + 1);
      if (showArchived) {
        setArchivedProjects((prev) => [{ ...project, archived: true }, ...prev]);
      }
      showToast("Project archived");
    }
  }

  async function handleUnarchive(project: ProjectWithStats) {
    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .update({ archived: false })
      .eq("id", project.id);
    if (!error) {
      setArchivedProjects((prev) => prev.filter((p) => p.id !== project.id));
      setArchivedCount((c) => Math.max(0, c - 1));
      setProjects((prev) => [...prev, { ...project, archived: false }]);
      showToast("Project restored");
    }
  }

  async function handleDelete(project: ProjectWithStats) {
    const confirmed = window.confirm(
      `Delete "${project.name}"? All tasks in this project will also be deleted.`
    );
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (!error) {
      if (project.archived) {
        setArchivedProjects((prev) => prev.filter((p) => p.id !== project.id));
        setArchivedCount((c) => Math.max(0, c - 1));
      } else {
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
      }
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
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-base font-semibold text-stone-700 dark:text-stone-200">
              My Projects
              <span className="ml-2 text-xs font-normal text-stone-400 dark:text-stone-500">
                {projects.length} {projects.length === 1 ? "project" : "projects"}
              </span>
            </h1>

            {archivedCount > 0 && (
              <button
                onClick={toggleShowArchived}
                className="flex items-center gap-1.5 text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25-2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                {showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
              </button>
            )}
          </div>

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

        {/* Active projects */}
        {projects.length === 0 && !showArchived ? (
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
        ) : projects.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={projects.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-visible">
                {projects.map((project) => (
                  <SortableProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    onEdit={() => setEditTarget(project)}
                    onArchive={() => handleArchive(project)}
                    onDelete={() => handleDelete(project)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : null}

        {/* Archived section */}
        {showArchived && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                Archived
              </h2>
              <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                {archivedCount}
              </span>
            </div>

            {archivedLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-600 dark:border-t-stone-300 animate-spin" />
              </div>
            ) : archivedProjects.length === 0 ? (
              <p className="text-xs text-stone-400 dark:text-stone-500 italic">No archived projects.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedProjects.map((project) => (
                  <ArchivedProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    onUnarchive={() => handleUnarchive(project)}
                    onDelete={() => handleDelete(project)}
                  />
                ))}
              </div>
            )}
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
