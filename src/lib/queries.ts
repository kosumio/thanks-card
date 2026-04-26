import { createClient } from "@/lib/supabase/server";
import type { DbEmployee } from "@/lib/database.types";
import type { Employee, ThanksCard } from "@/lib/types";

// --- Mappers ---

export function toEmployee(db: DbEmployee): Employee {
  return {
    id: db.id,
    employeeNumber: db.employee_number,
    name: db.name,
    nameKana: db.name_kana,
    location: db.location,
    isAdmin: db.is_admin,
  };
}

// --- Supabase nested select for cards ---

const CARD_SELECT = `
  id, message, is_picked, created_at,
  from:employees!from_id(id, employee_number, name, name_kana, location, is_admin, is_active, created_at),
  to:employees!to_id(id, employee_number, name, name_kana, location, is_admin, is_active, created_at),
  card_reactions(user_id)
`;

interface CardRow {
  id: string;
  message: string;
  is_picked: boolean;
  created_at: string;
  from: DbEmployee;
  to: DbEmployee;
  card_reactions: { user_id: string }[];
}

function toThanksCard(row: CardRow, currentUserId: string): ThanksCard {
  return {
    id: row.id,
    from: toEmployee(row.from),
    to: toEmployee(row.to),
    message: row.message,
    createdAt: row.created_at,
    reactionCount: row.card_reactions.length,
    reactedByMe: row.card_reactions.some((r) => r.user_id === currentUserId),
    isPicked: row.is_picked,
  };
}

// --- Queries ---

export async function getActiveEmployees(): Promise<Employee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("is_active", true)
    .order("name_kana");

  if (error) throw error;
  return (data as DbEmployee[]).map(toEmployee);
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return toEmployee(data as DbEmployee);
}

export async function getAllCards(currentUserId: string): Promise<ThanksCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("thanks_cards")
    .select(CARD_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as CardRow[]).map((row) =>
    toThanksCard(row, currentUserId)
  );
}

export async function getCardsForUser(
  userId: string,
  currentUserId: string
): Promise<{ received: ThanksCard[]; sent: ThanksCard[] }> {
  const supabase = await createClient();

  const [receivedResult, sentResult] = await Promise.all([
    supabase
      .from("thanks_cards")
      .select(CARD_SELECT)
      .eq("to_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("thanks_cards")
      .select(CARD_SELECT)
      .eq("from_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (receivedResult.error) throw receivedResult.error;
  if (sentResult.error) throw sentResult.error;

  return {
    received: (receivedResult.data as unknown as CardRow[]).map((row) =>
      toThanksCard(row, currentUserId)
    ),
    sent: (sentResult.data as unknown as CardRow[]).map((row) =>
      toThanksCard(row, currentUserId)
    ),
  };
}

export async function getReadCardIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("card_reads")
    .select("card_id")
    .eq("user_id", userId);

  if (error) throw error;
  return new Set((data as { card_id: string }[]).map((r) => r.card_id));
}
