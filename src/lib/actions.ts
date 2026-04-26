"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// --- Auth ---

export async function loginAction(
  formData: FormData
): Promise<{ error?: string }> {
  // Primary path: name-based login provides employeeId (uuid).
  // Fallback path: employeeNumber (kept for compatibility / API callers).
  const employeeId = formData.get("employeeId") as string | null;
  const employeeNumber = formData.get("employeeNumber") as string | null;

  if (!employeeId && !employeeNumber) {
    return { error: "社員を選択してください" };
  }

  const admin = createAdminClient();
  const lookup = admin
    .from("employees")
    .select("id, employee_number")
    .eq("is_active", true);
  const { data: emp, error: lookupError } = employeeId
    ? await lookup.eq("id", employeeId).single()
    : await lookup.eq("employee_number", employeeNumber!).single();

  if (lookupError || !emp) {
    return { error: "ログインできませんでした。管理者にお問い合わせください" };
  }

  // Sign in via Supabase Auth with deterministic credentials
  const email = `${emp.employee_number}@thanks-card.local`;
  const password = `tc_${emp.employee_number}`;

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      error: "認証エラーが発生しました。管理者にお問い合わせください",
    };
  }

  // TODO: Phase B — rate limiting
  revalidatePath("/", "layout");
  return {};
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

// --- Cards ---

export async function sendCardAction(
  formData: FormData
): Promise<{ error?: string }> {
  const toId = formData.get("toId") as string;
  const message = formData.get("message") as string;

  if (!toId || !message) {
    return { error: "宛先とメッセージを入力してください" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const employeeId = user.app_metadata?.employee_id;
  if (!employeeId) return { error: "社員情報が見つかりません" };

  const { error: cardError } = await supabase
    .from("thanks_cards")
    .insert({ from_id: employeeId, to_id: toId, message });

  if (cardError) {
    return { error: "カードの送信に失敗しました" };
  }

  revalidatePath("/");
  revalidatePath("/my");
  revalidatePath("/archive");
  revalidatePath("/ranking");
  return {};
}

// --- Reactions ---

export async function toggleReactionAction(
  cardId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from("card_reactions")
    .select("card_id")
    .eq("card_id", cardId)
    .eq("user_id", user.app_metadata?.employee_id)
    .maybeSingle();

  if (existing) {
    // Remove reaction
    const { error } = await supabase
      .from("card_reactions")
      .delete()
      .eq("card_id", cardId)
      .eq("user_id", user.app_metadata?.employee_id);

    if (error) return { error: "リアクションの削除に失敗しました" };
  } else {
    // Add reaction
    const { error } = await supabase
      .from("card_reactions")
      .insert({ card_id: cardId, user_id: user.app_metadata?.employee_id });

    if (error) return { error: "リアクションの追加に失敗しました" };
  }

  revalidatePath("/");
  revalidatePath("/my");
  revalidatePath("/archive");
  return {};
}

// --- Delete card ---

export async function deleteCardAction(
  cardId: string
): Promise<{ error?: string }> {
  if (!cardId) return { error: "カードIDが指定されていません" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const employeeId = user.app_metadata?.employee_id;
  const isAdmin = Boolean(user.app_metadata?.is_admin);
  if (!employeeId) return { error: "社員情報が見つかりません" };

  // Fetch the card to verify ownership before delete
  const { data: card, error: fetchErr } = await supabase
    .from("thanks_cards")
    .select("id, from_id")
    .eq("id", cardId)
    .single();

  if (fetchErr || !card) {
    return { error: "カードが見つかりません" };
  }
  if (card.from_id !== employeeId && !isAdmin) {
    return { error: "このカードを削除する権限がありません" };
  }

  // Hard delete — card_reactions / card_reads cascade via FK
  const { error: delErr } = await supabase
    .from("thanks_cards")
    .delete()
    .eq("id", cardId);

  if (delErr) {
    return { error: "カードの削除に失敗しました" };
  }

  revalidatePath("/");
  revalidatePath("/my");
  revalidatePath("/archive");
  revalidatePath("/ranking");
  revalidatePath("/admin");
  return {};
}

// --- Admin: Pick ---

export async function togglePickedAction(
  cardId: string,
  isPicked: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("thanks_cards")
    .update({ is_picked: isPicked })
    .eq("id", cardId);

  if (error) return { error: "好事例の選定状態を更新できませんでした" };

  revalidatePath("/admin");
  revalidatePath("/archive");
  return {};
}

// --- Read status ---

export async function markAsReadAction(
  cardIds: string[]
): Promise<{ error?: string }> {
  if (cardIds.length === 0) return {};

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const rows = cardIds.map((cardId) => ({
    card_id: cardId,
    user_id: user.app_metadata?.employee_id,
  }));

  const { error } = await supabase
    .from("card_reads")
    .upsert(rows, { ignoreDuplicates: true });

  if (error) return { error: "既読状態の更新に失敗しました" };

  return {};
}
