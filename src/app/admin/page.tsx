import { createClient } from "@/lib/supabase/server";
import {
  getAllCards,
  getActiveEmployees,
  getActiveCategories,
} from "@/lib/queries";
import AdminClient from "./admin-client";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.id ?? "";

  const [cards, employees, categories] = await Promise.all([
    getAllCards(currentUserId),
    getActiveEmployees(),
    getActiveCategories(),
  ]);

  return (
    <AdminClient
      cards={cards}
      employees={employees}
      categories={categories}
    />
  );
}
