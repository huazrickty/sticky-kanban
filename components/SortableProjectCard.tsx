"use client";

import { useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ProjectWithStats } from "@/app/(board)/projects/page";
import CircularProgress from "./CircularProgress";

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

interface Props {
  project: ProjectWithStats;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onClick: () => void;
}

export default function SortableProjectCard({ project, onEdit, onDelete, onArchive, onClick }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const overdue = isOverdue(project.due_date);
  const { total, completed, percentage } = project;

  const cardColor = project.color ?? "#E8E8E8";
  const cardEmoji = project.emoji ?? "📋";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 flex flex-col"
      onClick={onClick}
    >
      {/* Color accent border */}
      <div style={{ height: "4px", backgroundColor: cardColor, flexShrink: 0 }} />

      {/* Top row: drag handle + left info + right (circle + menu) */}
      <div
        className="flex items-start gap-3 p-5"
        style={{ backgroundColor: cardColor + "22" }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 mt-1 text-stone-300 dark:text-stone-600 hover:text-stone-400 dark:hover:text-stone-500 cursor-grab active:cursor-grabbing transition-colors"
          aria-label="Drag to reorder"
          tabIndex={0}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
            <circle cx="5" cy="4" r="1.2" />
            <circle cx="11" cy="4" r="1.2" />
            <circle cx="5" cy="8" r="1.2" />
            <circle cx="11" cy="8" r="1.2" />
            <circle cx="5" cy="12" r="1.2" />
            <circle cx="11" cy="12" r="1.2" />
          </svg>
        </button>

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
                className="absolute right-0 top-full mt-1 z-50 w-36 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-100 dark:border-stone-700 py-1 overflow-hidden"
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
                  onClick={() => { setMenuOpen(false); onArchive(); }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-stone-600 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25-2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  Archive
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
