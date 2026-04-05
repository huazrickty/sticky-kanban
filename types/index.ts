export type Project = {
  id: string;
  user_id: string;
  name: string;
  due_date: string | null;
  created_at: string;
  color?: string | null;
  emoji?: string | null;
};

export type Task = {
  id: string;
  user_id: string;
  project_id: string;
  category_id: string | null;
  title: string;
  status: "todo" | "ongoing" | "done";
  due_date: string | null;
  position: number;
  description?: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};
