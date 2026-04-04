export type Task = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  status: "todo" | "ongoing" | "done";
  due_date: string | null;
  position: number;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};
