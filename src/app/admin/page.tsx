import { createClient } from "@/lib/supabase/server";
import { getAllCards, getActiveEmployees } from "@/lib/queries";
import AdminClient from "./admin-client";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.app_metadata?.employee_id ?? "";

  const [cards, employees] = await Promise.all([
    getAllCards(currentUserId),
    getActiveEmployees(),
  ]);

  return <AdminClient cards={cards} employees={employees} />;
}
