-- supabase/seed.sql
-- カテゴリ初期データ（鮑屋グループ行動指針ベース）

insert into categories (value, display_order, icon, color_class, bg_class) values
  ('志高く、挑戦・進化', 1, '🔥', 'text-red-700', 'bg-red-100'),
  ('5S', 2, '✨', 'text-blue-700', 'bg-blue-100'),
  ('報連相', 3, '💬', 'text-green-700', 'bg-green-100'),
  ('思いやり', 4, '🤝', 'text-pink-700', 'bg-pink-100'),
  ('約束・ルールを守る', 5, '📌', 'text-purple-700', 'bg-purple-100');
