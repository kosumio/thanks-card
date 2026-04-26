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

export interface DbThanksCard {
  id: string;
  from_id: string;
  to_id: string;
  message: string;
  is_picked: boolean;
  created_at: string;
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
