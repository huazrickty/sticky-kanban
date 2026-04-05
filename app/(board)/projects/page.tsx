import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectsBoard from "@/components/ProjectsBoard";
import type { Project } from "@/types";

export type ProjectWithStats = Project & {
  total: number;
  completed: number;
  percentage: number;
};

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: projects }, { data: profile }, { data: taskStats }, { count: archivedCount }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("position", { ascending: true }),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single(),
      supabase
        .from("tasks")
        .select("project_id, status")
        .eq("user_id", user.id),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("archived", true),
    ]);

  const enrichedProjects: ProjectWithStats[] = (projects ?? []).map((project) => {
    const projectTasks = taskStats?.filter((t) => t.project_id === project.id) ?? [];
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === "done").length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { ...project, total, completed, percentage };
  });

  return (
    <ProjectsBoard
      initialProjects={enrichedProjects}
      userId={user.id}
      userEmail={user.email ?? ""}
      displayName={profile?.display_name ?? null}
      initialArchivedCount={archivedCount ?? 0}
    />
  );
}
