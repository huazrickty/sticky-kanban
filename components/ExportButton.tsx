"use client";

import * as XLSX from "xlsx";
import type { Task, Category } from "@/types";

interface Props {
  tasks: Task[];
  categories: Category[];
  projectName: string;
}

const STATUS_ORDER: Task["status"][] = ["todo", "ongoing", "done"];

const STATUS_LABEL: Record<Task["status"], string> = {
  todo: "To Do",
  ongoing: "Ongoing",
  done: "Done",
};

export default function ExportButton({ tasks, categories, projectName }: Props) {
  function handleExport() {
    // Sort: by status order, then by position within each status
    const sorted = [...tasks].sort((a, b) => {
      const statusDiff =
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (statusDiff !== 0) return statusDiff;
      return (a.position ?? 0) - (b.position ?? 0);
    });

    const data = sorted.map((task, i) => ({
      "No.": i + 1,
      Title: task.title,
      Category:
        categories.find((c) => c.id === task.category_id)?.name ?? "-",
      Status: STATUS_LABEL[task.status],
      "Due Date": task.due_date ?? "-",
      Description: task.description ?? "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // Column widths
    ws["!cols"] = [
      { wch: 5 },   // No.
      { wch: 30 },  // Title
      { wch: 20 },  // Category
      { wch: 12 },  // Status
      { wch: 15 },  // Due Date
      { wch: 40 },  // Description
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");

    const filename = `${projectName.replace(/\s+/g, "_")}_Progresses.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  return (
    <button
      onClick={handleExport}
      aria-label="Export to Excel"
      title="Export to Excel"
      className="fixed bottom-8 right-24 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
      style={{ backgroundColor: "#2c2c2a" }}
    >
      {/* Download icon: arrow pointing down into a tray */}
      <svg
        className="w-5 h-5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
    </button>
  );
}
