import { createClient } from "@/lib/supabase/server";
import { getAllCards, getActiveEmployees } from "@/lib/queries";
import RankingClient from "./ranking-client";

export default async function RankingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.app_metadata?.employee_id ?? "";

  const [cards, employees] = await Promise.all([
    getAllCards(currentUserId),
    getActiveEmployees(),
  ]);

  return (
    <RankingClient
      cards={cards}
      employees={employees}
      currentUserId={currentUserId}
    />
  );
}
