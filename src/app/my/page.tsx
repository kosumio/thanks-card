import { createClient } from "@/lib/supabase/server";
import {
  getCardsForUser,
  getReadCardIds,
  getAllCards,
  getActiveEmployees,
} from "@/lib/queries";
import MyPageClient from "./my-page-client";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.app_metadata?.employee_id ?? "";

  const [{ received, sent }, readCardIds, allCards, employees] =
    await Promise.all([
      getCardsForUser(currentUserId, currentUserId),
      getReadCardIds(currentUserId),
      getAllCards(currentUserId),
      getActiveEmployees(),
    ]);

  return (
    <MyPageClient
      received={received}
      sent={sent}
      readCardIds={Array.from(readCardIds)}
      allCards={allCards}
      totalEmployees={employees.length}
    />
  );
}
