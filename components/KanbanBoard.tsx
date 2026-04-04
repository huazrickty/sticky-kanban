"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { Task, Category } from "@/types";
import KanbanColumn from "./KanbanColumn";
import StickyNote from "./StickyNote";
import AddTaskModal from "./AddTaskModal";
import { createClient } from "@/lib/supabase/client";

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
}

export default function KanbanBoard({ initialTasks, categories, userId, userEmail }: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === String(event.active.id));
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = String(active.id);
    const newStatus = String(over.id) as Task["status"];

    if (!["todo", "ongoing", "done"].includes(newStatus)) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
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
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#f0ede8" }}>
      {/* Navbar */}
      <header className="shrink-0 bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-500 tracking-tight">
          Sticky Board
        </span>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-stone-700 border-b border-stone-700 pb-0.5">
            Board
          </span>
          <button
            onClick={() => router.push("/categories")}
            className="text-xs font-medium text-stone-400 hover:text-stone-700 transition-colors"
          >
            Categories
          </button>
          <span className="text-xs text-stone-400 hidden sm:block">{userEmail}</span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-xs font-medium text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loggingOut ? "Signing out…" : "Logout"}
          </button>
        </div>
      </header>

      {/* Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 grid grid-cols-3 gap-0">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.label}
              dot={col.dot}
              tasks={tasks.filter((t) => t.status === col.id)}
              categories={categories}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
          {activeTask ? (
            <StickyNote
              task={activeTask}
              category={activeCategory}
              categories={[]}
              isOverlay
              onTaskUpdated={() => {}}
              onTaskDeleted={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

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

      {/* Add task modal */}
      {isAddModalOpen && (
        <AddTaskModal
          defaultStatus="todo"
          categories={categories}
          userId={userId}
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
