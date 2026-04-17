import { createClient } from "@/lib/supabase/server";
import {
  getActiveEmployees,
  getActiveCategories,
  getAllCards,
} from "@/lib/queries";
import SendFormClient from "./send-form-client";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.id ?? "";

  const [employees, categories, cards] = await Promise.all([
    getActiveEmployees(),
    getActiveCategories(),
    getAllCards(currentUserId),
  ]);

  return (
    <SendFormClient
      employees={employees}
      categories={categories}
      cards={cards}
    />
  );
}
