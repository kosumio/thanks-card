import { createClient } from "@/lib/supabase/server";
import { getActiveEmployees, getAllCards } from "@/lib/queries";
import SendFormClient from "./send-form-client";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.app_metadata?.employee_id ?? "";

  const [employees, cards] = await Promise.all([
    getActiveEmployees(),
    getAllCards(currentUserId),
  ]);

  return <SendFormClient employees={employees} cards={cards} />;
}
