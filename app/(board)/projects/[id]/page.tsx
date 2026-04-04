import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KanbanBoard from "@/components/KanbanBoard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectBoardPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: project }, { data: tasks }, { data: categories }, { data: profile }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("tasks")
        .select("*")
        .eq("project_id", id)
        .order("position", { ascending: true }),
      supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true }),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single(),
    ]);

  if (!project) redirect("/projects");

  return (
    <KanbanBoard
      initialTasks={tasks ?? []}
      categories={categories ?? []}
      userId={user.id}
      userEmail={user.email ?? ""}
      displayName={profile?.display_name ?? null}
      projectId={id}
      projectName={project.name}
    />
  );
}
