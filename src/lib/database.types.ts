export interface DbEmployee {
  id: string;
  employee_number: string;
  name: string;
  name_kana: string;
  location: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface DbCategory {
  id: string;
  value: string;
  display_order: number;
  color_class: string | null;
  bg_class: string | null;
  icon: string | null;
  is_active: boolean;
}

export interface DbThanksCard {
  id: string;
  from_id: string;
  to_id: string;
  message: string;
  is_picked: boolean;
  created_at: string;
}

export interface DbCardCategory {
  card_id: string;
  category_id: string;
}

export interface DbCardReaction {
  card_id: string;
  user_id: string;
  created_at: string;
}

export interface DbCardRead {
  card_id: string;
  user_id: string;
  read_at: string;
}
