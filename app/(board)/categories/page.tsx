import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CategoriesBoard from "@/components/CategoriesBoard";

export default async function CategoriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <CategoriesBoard
      initialCategories={categories ?? []}
      userId={user.id}
      userEmail={user.email ?? ""}
    />
  );
}
