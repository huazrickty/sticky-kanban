"use client";

import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, Category } from "@/types";
import { createClient } from "@/lib/supabase/client";
import EditTaskModal from "./EditTaskModal";

interface Props {
  task: Task;
  category: Category | null;
  categories: Category[];
  isOverlay?: boolean;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isDueSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 2;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function StickyNote({
  task,
  category,
  categories,
  isOverlay = false,
  onTaskUpdated,
  onTaskDeleted,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isOverlay,
  });

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleDelete() {
    setMenuOpen(false);
    const confirmed = window.confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (!error) onTaskDeleted(task.id);
  }

  function handleEditClick() {
    setMenuOpen(false);
    setEditOpen(true);
  }

  const done = task.status === "done";
  const noteColor = category?.color ?? "#FEF9C3";
  const formattedDate = formatDate(task.due_date);
  const overdue = isOverdue(task.due_date) && !done;
  const dueSoon = isDueSoon(task.due_date) && !done;

  // Deterministic slight rotation based on task id — gives each note a unique tilt
  const BASE_ROTATIONS = ["-1deg", "0.5deg", "-0.5deg"];
  const baseRotation = isOverlay ? "-2deg" : BASE_ROTATIONS[task.id.charCodeAt(0) % 3];
  const dndTransform = CSS.Transform.toString(transform);
  const combinedTransform = dndTransform
    ? `${dndTransform} rotate(${baseRotation})`
    : `rotate(${baseRotation})`;

  const style: React.CSSProperties = {
    transform: combinedTransform,
    transition,
    backgroundColor: noteColor,
    opacity: isDragging ? 0 : done ? 0.65 : 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={[
          "relative w-44 min-h-32 rounded-xl px-4 py-3.5 select-none group",
          "transition-shadow duration-150 ease-out",
          !isDragging && !isOverlay && "hover:shadow-md",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Three-dot menu */}
        {!isOverlay && (
          <div
            ref={menuRef}
            className="absolute top-2 right-2"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className={[
                "w-6 h-6 flex items-center justify-center rounded-md text-stone-400",
                "opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-100",
                "hover:bg-black/10 active:bg-black/10 hover:text-stone-600 active:text-stone-600",
                menuOpen && "md:opacity-100",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label="Task options"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-7 z-20 w-32 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-100 dark:border-stone-700 py-1 overflow-hidden"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleEditClick}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-stone-600 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-stone-400 dark:text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={handleDelete}
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
        )}

        {/* Category tag */}
        {category && (
          <div className="flex items-center gap-1.5 mb-2 pr-6">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: darken(noteColor, 0.35) }}
            />
            <span
              className="text-xs font-medium tracking-wide"
              style={{ color: darken(noteColor, 0.45) }}
            >
              {category.name}
            </span>
          </div>
        )}

        {/* Title */}
        <p
          className={[
            "text-sm font-medium leading-snug text-stone-800",
            category ? "pr-6" : "pr-6",
            done && "line-through opacity-60",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {task.title}
        </p>

        {/* Due date */}
        {formattedDate && (
          <div className="mt-2.5 flex items-center gap-1">
            <svg
              className="w-3 h-3 shrink-0"
              style={{ color: overdue ? "#ef4444" : dueSoon ? "#f59e0b" : darken(noteColor, 0.3) }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span
              className="text-xs font-medium"
              style={{ color: overdue ? "#ef4444" : dueSoon ? "#f59e0b" : darken(noteColor, 0.35) }}
            >
              {overdue ? `Overdue · ${formattedDate}` : formattedDate}
            </span>
          </div>
        )}
      </div>

      {editOpen && (
        <EditTaskModal
          task={task}
          categories={categories}
          onClose={() => setEditOpen(false)}
          onTaskUpdated={(updated) => {
            onTaskUpdated(updated);
            setEditOpen(false);
          }}
        />
      )}
    </>
  );
}

/**
 * Darken a hex color by mixing it toward black by `amount` (0–1).
 */
function darken(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = Math.round(((num >> 16) & 0xff) * (1 - amount));
  const g = Math.round(((num >> 8) & 0xff) * (1 - amount));
  const b = Math.round((num & 0xff) * (1 - amount));
  return `rgb(${r},${g},${b})`;
}
