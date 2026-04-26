-- 2026-04-27 カテゴリ完全廃止
-- カテゴリは2026-04-27時点でMVV未確定につき一旦廃止。
-- 過去カードのカテゴリ紐付け情報も含めて削除する。
-- MVV確定後に再導入する場合は新マスタとして再設計する。

drop policy if exists "card_cat_select" on card_categories;
drop policy if exists "card_cat_insert" on card_categories;
drop table if exists card_categories;

drop policy if exists "categories_select" on categories;
drop policy if exists "categories_admin" on categories;
drop table if exists categories;
