"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Task, Category } from "@/types";
import StickyNote from "./StickyNote";

interface Props {
  id: Task["status"];
  title: string;
  dot: string;
  tasks: Task[];
  categories: Category[];
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export default function KanbanColumn({
  id,
  title,
  dot,
  tasks,
  categories,
  onTaskUpdated,
  onTaskDeleted,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full border-r border-stone-300/50 last:border-r-0">
      {/* Column header — fixed at top */}
      <div className="shrink-0 flex items-center gap-2 px-6 py-4 border-b border-stone-300/40">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: dot }}
        />
        <h2 className="text-sm font-semibold text-stone-600 tracking-wide uppercase">
          {title}
        </h2>
        <span className="ml-auto text-xs font-medium text-stone-400 bg-stone-200/60 px-2 py-0.5 rounded-full tabular-nums">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone — scrollable, fills remaining height */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto flex flex-col gap-3 px-4 py-4 transition-colors duration-150"
        style={{
          backgroundColor: isOver ? "rgba(120,113,108,0.08)" : "transparent",
          outline: isOver ? "2px dashed rgba(120,113,108,0.25)" : "2px dashed transparent",
          outlineOffset: "-4px",
        }}
      >
        {tasks.map((task) => (
          <StickyNote
            key={task.id}
            task={task}
            category={categories.find((c) => c.id === task.category_id) ?? null}
            categories={categories}
            onTaskUpdated={onTaskUpdated}
            onTaskDeleted={onTaskDeleted}
          />
        ))}

        {tasks.length === 0 && !isOver && (
          <p className="text-xs text-stone-400 text-center pt-6 select-none">
            No tasks
          </p>
        )}
      </div>
    </div>
  );
}
