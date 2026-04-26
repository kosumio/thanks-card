-- supabase/policies.sql
-- RLS ポリシー定義

-- employees
alter table employees enable row level security;
create policy "employees_select" on employees for select using (true);
create policy "employees_update_self" on employees for update using (id = current_employee_id());
create policy "employees_admin" on employees for all using (is_current_admin());

-- thanks_cards
alter table thanks_cards enable row level security;
create policy "cards_select" on thanks_cards for select using (true);
create policy "cards_insert" on thanks_cards for insert
  with check (from_id = current_employee_id());
create policy "cards_update_picked" on thanks_cards for update
  using (is_current_admin());
create policy "cards_delete" on thanks_cards for delete
  using (from_id = current_employee_id() or is_current_admin());

-- card_reactions
alter table card_reactions enable row level security;
create policy "reactions_select" on card_reactions for select using (true);
create policy "reactions_insert" on card_reactions for insert
  with check (user_id = current_employee_id());
create policy "reactions_delete" on card_reactions for delete
  using (user_id = current_employee_id());

-- card_reads
alter table card_reads enable row level security;
create policy "reads_select" on card_reads for select using (true);
create policy "reads_insert" on card_reads for insert
  with check (user_id = current_employee_id());
