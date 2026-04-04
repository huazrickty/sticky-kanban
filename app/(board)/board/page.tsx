import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KanbanBoard from "@/components/KanbanBoard";

export default async function BoardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: tasks }, { data: categories }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true }),
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  return (
    <KanbanBoard
      initialTasks={tasks ?? []}
      categories={categories ?? []}
      userId={user.id}
      userEmail={user.email ?? ""}
    />
  );
}
