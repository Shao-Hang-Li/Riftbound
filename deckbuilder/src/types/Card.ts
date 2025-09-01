export interface Card {
  _id?: string;
  name: string;
  image_path: string;
  card_id: string;
  set_name: string;
  set_code: string; // e.g., "OGN", "OGS"
  set_release_date?: string; // ISO date string
  card_type: CardType;
  subtype: string[]; // Array of subtypes, e.g., ["Human", "Warrior"]
  color: CardColor[];
  cost: number; // 0 to 7+
  rarity: CardRarity;
  might?: number; // For Units
  description?: string;
  flavor_text?: string;
  artist?: string;
  collector_number: string; // e.g., "001", "002"
  keywords?: string[]; // e.g., ["Flying", "First Strike"]
  created_at?: string;
  updated_at?: string;
}

export interface Deck {
  _id?: string;
  name: string;
  description?: string;
  card_ids: string[];
  deck_colors: CardColor[];
  total_cost: number;
  average_cost: number;
  card_type_distribution: Record<CardType, number>;
  created_at?: string;
  updated_at?: string;
}

export type CardType = 
  | "Spell"
  | "Unit"
  | "Champion"
  | "Legend"
  | "Battlefield"
  | "Gear"
  | "Rune"
  | "Token";

export type CardColor = 
  | "Fury"
  | "Body"
  | "Mind"
  | "Calm"
  | "Chaos"
  | "Order"
  | "Colorless";

export type CardRarity = 
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Overnumbered";

export interface SetInfo {
  _id?: string;
  set_code: string;
  set_name: string;
  set_full_name: string;
  release_date: string;
  card_count: number;
  is_active: boolean;
  description?: string;
}
