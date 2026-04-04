"use client";

import { useEffect, useRef, useState } from "react";
import type { Task, Category } from "@/types";
import { createClient } from "@/lib/supabase/client";
import EditTaskModal from "./EditTaskModal";

interface Props {
  task: Task;
  categories: Category[];
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

const STATUS_CONFIG: Record<Task["status"], { label: string; className: string }> = {
  todo: {
    label: "Todo",
    className:
      "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300",
  },
  ongoing: {
    label: "Ongoing",
    className:
      "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  },
  done: {
    label: "Done",
    className:
      "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
  },
};

const STATUS_ORDER: Task["status"][] = ["todo", "ongoing", "done"];

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TaskDetailModal({
  task: initialTask,
  categories,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: Props) {
  const [task, setTask] = useState<Task>(initialTask);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(initialTask.title);
  const [description, setDescription] = useState(initialTask.description ?? "");
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const category = categories.find((c) => c.id === task.category_id) ?? null;
  const formattedDate = formatDate(task.due_date);
  const statusConfig = STATUS_CONFIG[task.status];

  // Escape to close (unless EditTaskModal is open on top)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !editTaskOpen) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editTaskOpen]);

  // Focus title input when entering edit mode
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  // Auto-save description with 800ms debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (description !== (task.description ?? "")) {
        const supabase = createClient();
        const { error } = await supabase
          .from("tasks")
          .update({ description: description || null })
          .eq("id", task.id);
        if (!error) {
          const updated = { ...task, description: description || null };
          setTask(updated);
          onTaskUpdated(updated);
          showSaved();
        }
      }
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description]);

  // Cleanup saved indicator timer on unmount
  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  function showSaved() {
    setSavedIndicator(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedIndicator(false), 2000);
  }

  async function saveDescription() {
    if (description === (task.description ?? "")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ description: description || null })
      .eq("id", task.id);
    if (!error) {
      const updated = { ...task, description: description || null };
      setTask(updated);
      onTaskUpdated(updated);
      showSaved();
    }
  }

  async function saveTitle() {
    const trimmed = titleValue.trim();
    setEditingTitle(false);
    if (!trimmed || trimmed === task.title) {
      setTitleValue(task.title);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("tasks")
      .update({ title: trimmed })
      .eq("id", task.id)
      .select()
      .single();
    if (data) {
      const updated = { ...task, title: trimmed };
      setTask(updated);
      onTaskUpdated(updated);
    }
  }

  async function cycleStatus() {
    if (savingStatus) return;
    const idx = STATUS_ORDER.indexOf(task.status);
    const newStatus = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    setSavingStatus(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id);
    if (!error) {
      const updated = { ...task, status: newStatus };
      setTask(updated);
      onTaskUpdated(updated);
    }
    setSavingStatus(false);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this task?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (!error) {
      onTaskDeleted(task.id);
      onClose();
    }
  }

  // When EditTaskModal saves, sync back into this modal
  function handleEditTaskSaved(updated: Task) {
    setTask(updated);
    setTitleValue(updated.title);
    onTaskUpdated(updated);
    setEditTaskOpen(false);
  }

  if (editTaskOpen) {
    return (
      <EditTaskModal
        task={task}
        categories={categories}
        onClose={() => setEditTaskOpen(false)}
        onTaskUpdated={handleEditTaskSaved}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4 animate-fadeIn"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex flex-col w-full h-full sm:h-auto sm:max-w-lg bg-white dark:bg-stone-900 sm:rounded-2xl shadow-xl border-0 sm:border sm:border-stone-100 dark:sm:border-stone-700 overflow-hidden">

        {/* Header */}
        <div className="shrink-0 px-6 pt-5 pb-4 border-b border-stone-100 dark:border-stone-700">
          {/* Category pill */}
          {category && (
            <div className="flex items-center gap-1.5 mb-3">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {category.name}
              </span>
            </div>
          )}

          <div className="flex items-start gap-3">
            {/* Inline-editable title */}
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") {
                      setTitleValue(task.title);
                      setEditingTitle(false);
                    }
                  }}
                  className="w-full text-lg font-semibold text-stone-800 dark:text-stone-100 bg-transparent border-b-2 border-stone-400 dark:border-stone-500 outline-none pb-0.5 leading-snug"
                />
              ) : (
                <h2
                  className="text-lg font-semibold text-stone-800 dark:text-stone-100 cursor-text hover:opacity-70 transition-opacity leading-snug"
                  onClick={() => setEditingTitle(true)}
                  title="Click to edit title"
                >
                  {task.title}
                </h2>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="shrink-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1 -mr-1 mt-0.5"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Status badge + due date */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={cycleStatus}
              disabled={savingStatus}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity",
                statusConfig.className,
                savingStatus ? "opacity-50 cursor-not-allowed" : "hover:opacity-75",
              ].join(" ")}
              title="Click to change status"
            >
              {task.status === "done" && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
              {statusConfig.label}
              <svg className="w-2.5 h-2.5 opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
              </svg>
            </button>

            {formattedDate && (
              <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span>{formattedDate}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-stone-100 dark:border-stone-700/60" />

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                Notes
              </span>
              <span
                className="text-xs text-emerald-500 dark:text-emerald-400 transition-opacity duration-300"
                style={{ opacity: savedIndicator ? 1 : 0 }}
              >
                Saved ✓
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveDescription();
                }
              }}
              placeholder="Add notes..."
              className="w-full resize-none rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 px-3.5 py-3 text-sm text-stone-700 dark:text-stone-300 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none focus:border-stone-300 dark:focus:border-stone-600 focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700/50 transition min-h-[120px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-stone-100 dark:border-stone-700">
          <button
            onClick={handleDelete}
            className="text-xs font-medium text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Delete
          </button>

          <button
            onClick={() => setEditTaskOpen(true)}
            className="text-xs font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 px-4 py-2 rounded-lg transition-colors"
          >
            Edit task
          </button>
        </div>
      </div>
    </div>
  );
}
