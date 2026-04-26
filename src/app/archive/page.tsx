import { createClient } from "@/lib/supabase/server";
import { getAllCards, getActiveEmployees } from "@/lib/queries";
import ArchiveClient from "./archive-client";

export default async function ArchivePage() {
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
    <ArchiveClient
      cards={cards}
      employees={employees}
      currentUserId={currentUserId}
    />
  );
}
