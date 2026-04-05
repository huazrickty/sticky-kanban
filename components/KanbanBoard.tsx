"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Task, Category } from "@/types";
import KanbanColumn from "./KanbanColumn";
import StickyNote from "./StickyNote";
import AddTaskModal from "./AddTaskModal";
import EditProfileModal from "./EditProfileModal";
import TaskDetailModal from "./TaskDetailModal";
import ExportButton from "./ExportButton";
import KeyboardHints from "./KeyboardHints";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "./ThemeProvider";

const COLUMNS: { id: Task["status"]; label: string; dot: string }[] = [
  { id: "todo", label: "Todo", dot: "#a8a29e" },
  { id: "ongoing", label: "Ongoing", dot: "#f59e0b" },
  { id: "done", label: "Done", dot: "#6ee7b7" },
];

interface Props {
  initialTasks: Task[];
  categories: Category[];
  userId: string;
  userEmail: string;
  displayName: string | null;
  projectId: string;
  projectName: string;
}

export default function KanbanBoard({
  initialTasks,
  categories,
  userId,
  userEmail,
  displayName: initialDisplayName,
  projectId,
  projectName,
}: Props) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(initialDisplayName);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      const anyModalOpen = isAddModalOpen || isProfileModalOpen || !!selectedTask;

      if ((e.key === "n" || e.key === "N") && !anyModalOpen) {
        setIsAddModalOpen(true);
        return;
      }

      if (e.key === "Escape") {
        if (isAddModalOpen) setIsAddModalOpen(false);
        if (isProfileModalOpen) setIsProfileModalOpen(false);
        if (selectedTask) setSelectedTask(null);
        return;
      }

      if (selectedTask) {
        const statusMap: Record<string, Task["status"]> = {
          "1": "todo",
          "2": "ongoing",
          "3": "done",
        };
        const newStatus = statusMap[e.key];
        if (newStatus && newStatus !== selectedTask.status) {
          handleTaskUpdated({ ...selectedTask, status: newStatus });
          setSelectedTask((prev) => prev ? { ...prev, status: newStatus } : prev);
          const supabase = createClient();
          supabase.from("tasks").update({ status: newStatus }).eq("id", selectedTask.id);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAddModalOpen, isProfileModalOpen, selectedTask]);

  const visibleName = displayName || userEmail;
  const avatarLetter = (displayName || userEmail).charAt(0).toUpperCase();

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      searchQuery === "" ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategoryId === null || t.category_id === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === String(event.active.id));
    setActiveTask(task ?? null);
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const draggedTask = tasks.find((t) => t.id === activeId);
    if (!draggedTask) return;

    const overTask = tasks.find((t) => t.id === overId);

    if (overTask && draggedTask.status === overTask.status) {
      // Same-column reorder
      const columnTasks = tasks
        .filter((t) => t.status === draggedTask.status)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);
      const reordered = arrayMove(columnTasks, oldIndex, newIndex).map((t, i) => ({
        ...t,
        position: i,
      }));

      setTasks((prev) => [
        ...prev.filter((t) => t.status !== draggedTask.status),
        ...reordered,
      ]);

      const supabase = createClient();
      reordered.forEach((t) => {
        supabase.from("tasks").update({ position: t.position }).eq("id", t.id);
      });
    } else {
      // Cross-column move — over is a task in another column or a column drop zone
      const newStatus = (overTask ? overTask.status : overId) as Task["status"];
      if (!["todo", "ongoing", "done"].includes(newStatus)) return;
      if (draggedTask.status === newStatus) return;

      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t))
      );

      const supabase = createClient();
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", activeId);

      if (error) {
        setTasks((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, status: draggedTask.status } : t))
        );
      }
    }
  }

  function handleTaskAdded(task: Task) {
    setTasks((prev) => [...prev, task]);
  }

  function handleTaskUpdated(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  const activeCategory = activeTask
    ? (categories.find((c) => c.id === activeTask.category_id) ?? null)
    : null;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f0ede8] dark:bg-stone-900">
      {/* Navbar */}
      <header className="shrink-0 bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: back link + project name */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/projects")}
            className="shrink-0 flex items-center gap-1 text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
            aria-label="Back to projects"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="hidden sm:inline">Projects</span>
          </button>
          <span className="text-stone-300 dark:text-stone-600 select-none">/</span>
          <span className="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate">
            {projectName}
          </span>
        </div>

        {/* Right: nav actions */}
        <div className="flex items-center gap-4 shrink-0">
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

      {/* Filter bar */}
      <div className="shrink-0 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 border-b border-stone-200/60 dark:border-stone-700/60 bg-[#ebe8e3] dark:bg-stone-900/80">
        {/* Search input */}
        <div className="relative w-full sm:w-auto">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 dark:text-stone-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks…"
            className="w-full sm:w-44 pl-8 pr-7 py-1.5 rounded-lg text-xs text-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 bg-stone-200/50 dark:bg-stone-800/60 border border-transparent dark:border-stone-700/50 focus:border-stone-300 dark:focus:border-stone-600 focus:bg-white dark:focus:bg-stone-800 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 sm:flex-wrap no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={[
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
              selectedCategoryId === null
                ? "bg-stone-600 text-white"
                : "bg-stone-200/60 dark:bg-stone-700/50 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-stone-200",
            ].join(" ")}
          >
            All
          </button>

          {categories.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(isActive ? null : cat.id)}
                className={[
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "text-stone-700"
                    : "bg-stone-200/60 dark:bg-stone-700/50 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-stone-200",
                ].join(" ")}
                style={isActive ? { backgroundColor: cat.color } : undefined}
              >
                {!isActive && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                    style={{ backgroundColor: cat.color }}
                  />
                )}
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Columns — deferred to client only to avoid dnd-kit aria-describedby hydration mismatch */}
      {mounted ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 overflow-y-auto md:overflow-visible">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.label}
                dot={col.dot}
                tasks={filteredTasks
                  .filter((t) => t.status === col.id)
                  .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                }
                categories={categories}
                onTaskClick={(task) => setSelectedTask(task)}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null} style={{ background: "none", boxShadow: "none" }}>
            {activeTask ? (
              <div style={{ opacity: 0.92, transform: "rotate(2deg) scale(1.02)", cursor: "grabbing" }}>
                <StickyNote
                  task={activeTask}
                  category={activeCategory}
                  categories={categories}
                  isOverlay
                  onTaskUpdated={() => {}}
                  onTaskDeleted={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      {/* Keyboard hints */}
      <KeyboardHints />

      {/* Export button */}
      <ExportButton tasks={tasks} categories={categories} projectName={projectName} />

      {/* FAB */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        aria-label="Add task"
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
        style={{ backgroundColor: "#2c2c2a" }}
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Profile modal */}
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

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          categories={categories}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={(updated) => {
            handleTaskUpdated(updated);
            setSelectedTask(updated);
          }}
          onTaskDeleted={(taskId) => {
            handleTaskDeleted(taskId);
            setSelectedTask(null);
          }}
        />
      )}

      {/* Add task modal */}
      {isAddModalOpen && (
        <AddTaskModal
          defaultStatus="todo"
          categories={categories}
          userId={userId}
          projectId={projectId}
          onClose={() => setIsAddModalOpen(false)}
          onTaskAdded={(task) => {
            handleTaskAdded(task);
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
