export interface Card {
  _id?: string;
  name: string;
  image_path: string;
  card_id: string;
  set_name: string;
  card_type: string;
  description?: string;
}

export interface Deck {
  _id?: string;
  name: string;
  description?: string;
  card_ids: string[];
  created_at?: string;
  updated_at?: string;
}
