-- グッドサンクス投票情報を保持するテーブル
-- thanks_cards.is_picked = true のカードに対する複数投票者・理由をぶら下げる
create table if not exists good_thanks_votes (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references thanks_cards(id) on delete cascade,
  voter_name text not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_good_thanks_votes_card on good_thanks_votes(card_id);

alter table good_thanks_votes enable row level security;
create policy "good_thanks_votes_select" on good_thanks_votes for select using (true);
create policy "good_thanks_votes_admin" on good_thanks_votes for all using (is_current_admin());
