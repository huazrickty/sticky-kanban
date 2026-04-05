"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  onClose: () => void;
}

const STEPS = [
  {
    title: "Welcome to Sticky Kanban! 👋",
    body: "Your visual workspace for managing tasks across projects. Let's show you around in 4 quick steps.",
    visual: (
      <div className="flex gap-2 justify-center">
        {["#FEF3A0", "#BFE3FA", "#C8EBC6"].map((color, i) => (
          <div
            key={i}
            className="w-16 h-20 rounded-xl flex flex-col gap-1.5 p-2 shadow-sm"
            style={{ backgroundColor: color, transform: i === 1 ? "rotate(1deg)" : i === 0 ? "rotate(-1.5deg)" : "rotate(0.5deg)" }}
          >
            <div className="h-1.5 w-10 rounded-full bg-black/10" />
            <div className="h-1.5 w-8 rounded-full bg-black/10" />
            <div className="h-1.5 w-6 rounded-full bg-black/10" />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Start with a Project 📁",
    body: "Everything lives inside a project. Create one for your FYP, work, personal goals — anything you want to track.",
    visual: (
      <div className="flex flex-col gap-2">
        {[
          { emoji: "🎯", name: "Final Year Project", color: "#E3DAFC" },
          { emoji: "💻", name: "Work Tasks", color: "#BFE3FA" },
          { emoji: "🌟", name: "Personal Goals", color: "#FEF3A0" },
        ].map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
            style={{ borderLeft: `3px solid ${p.color}` }}
          >
            <span className="text-base">{p.emoji}</span>
            <span className="text-xs font-medium text-stone-700 dark:text-stone-200">{p.name}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Tasks as Sticky Notes 🗒️",
    body: "Add tasks as colorful sticky notes. Each color represents a category. Drag them between columns as you make progress.",
    visual: (
      <div className="flex gap-3 justify-center">
        {[
          { color: "#FEF3A0", label: "Design landing page", cat: "Design", catColor: "#F9C6E0" },
          { color: "#C8EBC6", label: "Write unit tests", cat: "Dev", catColor: "#BFE3FA" },
        ].map((note) => (
          <div
            key={note.label}
            className="w-28 rounded-xl p-2.5 shadow-sm flex flex-col gap-1.5"
            style={{ backgroundColor: note.color }}
          >
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: note.catColor }} />
              <span className="text-[9px] font-medium text-stone-500">{note.cat}</span>
            </div>
            <span className="text-[10px] font-semibold text-stone-700 leading-snug">{note.label}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Three Stages 📊",
    body: "To Do → Ongoing → Done. Move your sticky notes across columns to track progress. Your completion % updates automatically.",
    visual: (
      <div className="flex gap-2 justify-center">
        {[
          { label: "To Do", dot: "#a8a29e", count: 3 },
          { label: "Ongoing", dot: "#f59e0b", count: 2 },
          { label: "Done", dot: "#6ee7b7", count: 5 },
        ].map((col) => (
          <div key={col.label} className="flex-1 rounded-xl bg-stone-100 dark:bg-stone-800 p-2">
            <div className="flex items-center gap-1 mb-2">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: col.dot }} />
              <span className="text-[9px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">{col.label}</span>
            </div>
            <div className="flex flex-col gap-1">
              {Array.from({ length: col.count > 2 ? 2 : col.count }).map((_, i) => (
                <div key={i} className="h-6 rounded-lg bg-white dark:bg-stone-700 shadow-sm" />
              ))}
              {col.count > 2 && (
                <div className="text-[8px] text-stone-400 text-center">+{col.count - 2} more</div>
              )}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Pro Tips ⚡",
    body: "Use keyboard shortcuts to work faster:",
    visual: (
      <div className="flex flex-col gap-2">
        {[
          { key: "N", label: "Add new task" },
          { key: "Esc", label: "Close any modal" },
          { key: "1 / 2 / 3", label: "Change task status" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <kbd
              className="shrink-0 inline-flex items-center justify-center px-2 py-1 rounded-lg text-xs font-mono font-semibold text-stone-700 dark:text-stone-200"
              style={{
                background: "rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.12)",
                minWidth: "36px",
              }}
            >
              {key}
            </kbd>
            <span className="text-sm text-stone-600 dark:text-stone-300">{label}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export default function TutorialModal({ userId, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const isLast = step === STEPS.length - 1;

  async function dismiss() {
    const supabase = createClient();
    await supabase.from("profiles").update({ show_tutorial: false }).eq("id", userId);
    onClose();
  }

  function next() {
    setExiting(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setExiting(false);
    }, 150);
  }

  function back() {
    setExiting(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setExiting(false);
    }, 150);
  }

  const current = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-700 flex flex-col overflow-hidden">
        {/* Body */}
        <div
          className="flex flex-col gap-5 px-8 pt-8 pb-6 transition-opacity duration-150"
          style={{ opacity: exiting ? 0 : 1 }}
        >
          {/* Visual */}
          <div className="min-h-[100px] flex items-center justify-center py-2">
            {current.visual}
          </div>

          {/* Text */}
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 leading-snug">
              {current.title}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {current.body}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === step ? "18px" : "6px",
                height: "6px",
                backgroundColor: i === step ? "#78716c" : "#d6d3d1",
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex flex-col gap-3 px-8 pb-7">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={back}
                className="flex-1 rounded-xl border border-stone-200 dark:border-stone-600 px-4 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={isLast ? dismiss : next}
              className="flex-1 rounded-xl bg-stone-800 dark:bg-stone-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
            >
              {isLast ? "Get started" : "Next →"}
            </button>
          </div>

          <button
            onClick={dismiss}
            className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors text-center"
          >
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
