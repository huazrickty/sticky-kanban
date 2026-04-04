"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { Task, Category } from "@/types";
import StickyNote from "./StickyNote";

const EMPTY_MESSAGES: Record<string, string> = {
  todo: "No tasks yet. Add one!",
  ongoing: "Nothing in progress.",
  done: "Nothing done yet.",
};

interface Props {
  id: Task["status"];
  title: string;
  dot: string;
  tasks: Task[];
  categories: Category[];
  onTaskClick: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export default function KanbanColumn({
  id,
  title,
  dot,
  tasks,
  categories,
  onTaskClick,
  onTaskUpdated,
  onTaskDeleted,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col h-auto md:h-full border-b border-stone-300/50 dark:border-stone-700/50 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      {/* Column header */}
      <div className="shrink-0 flex items-center gap-2 px-6 py-4 border-b border-stone-300/40 dark:border-stone-700/40">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: dot }}
        />
        <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-300 tracking-wide uppercase">
          {title}
        </h2>
        <span className="ml-auto text-xs font-medium text-stone-400 dark:text-stone-500 bg-stone-200/60 dark:bg-stone-700 px-2 py-0.5 rounded-full tabular-nums">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-wrap gap-3 content-start p-3 pb-6 transition-colors duration-150"
        style={{
          backgroundColor: isOver ? "rgba(120,113,108,0.08)" : "transparent",
          outline: isOver ? "2px dashed rgba(120,113,108,0.25)" : "2px dashed transparent",
          outlineOffset: "-4px",
        }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={rectSortingStrategy}>
          {tasks.map((task) => (
            <StickyNote
              key={task.id}
              task={task}
              category={categories.find((c) => c.id === task.category_id) ?? null}
              categories={categories}
              onTaskClick={() => onTaskClick(task)}
              onTaskUpdated={onTaskUpdated}
              onTaskDeleted={onTaskDeleted}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div className="w-full flex flex-col items-center justify-center gap-3 py-8 select-none">
            <svg
              width="48"
              height="52"
              viewBox="0 0 48 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="4" y="2" width="38" height="42" rx="3" fill="#e7e3dd" />
              <path d="M30 2 L42 14 L30 14 Z" fill="#d4cfc8" />
              <path d="M30 2 L42 14 L30 14 Z" fill="none" stroke="#cbc6bf" strokeWidth="0.5" />
              <line x1="11" y1="22" x2="30" y2="22" stroke="#c5c0b8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="11" y1="28" x2="28" y2="28" stroke="#c5c0b8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="11" y1="34" x2="22" y2="34" stroke="#c5c0b8" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="23" cy="2" r="3" fill="#b8b2aa" />
              <circle cx="23" cy="2" r="1.5" fill="#a09990" />
            </svg>

            <p className="text-xs text-stone-400 dark:text-stone-500 text-center leading-relaxed">
              {EMPTY_MESSAGES[id]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
