import { Deck } from '../types';

interface SavedDeck extends Deck {
  _id: string;
  created_at: string;
  updated_at: string;
}

class DeckService {
  private baseUrl = '';

  async getDecks(): Promise<SavedDeck[]> {
    try {
      const response = await fetch(`${this.baseUrl}/decks`);
      if (!response.ok) {
        throw new Error(`Failed to fetch decks: ${response.statusText}`);
      }
      const data = await response.json();
      return data.decks || [];
    } catch (error) {
      console.error('Error fetching decks:', error);
      throw error;
    }
  }

  async getDeckById(deckId: string): Promise<SavedDeck | null> {
    try {
      const response = await fetch(`${this.baseUrl}/decks/${deckId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch deck: ${response.statusText}`);
      }
      const data = await response.json();
      return data.deck || null;
    } catch (error) {
      console.error('Error fetching deck:', error);
      throw error;
    }
  }

  async saveDeck(deck: Omit<Deck, '_id' | 'created_at' | 'updated_at'>): Promise<SavedDeck> {
    try {
      const response = await fetch(`${this.baseUrl}/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deck),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to save deck: ${errorData.detail || errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.deck || data;
    } catch (error) {
      console.error('Error saving deck:', error);
      throw error;
    }
  }

  async updateDeck(deckId: string, deck: Partial<Deck>): Promise<SavedDeck> {
    try {
      const response = await fetch(`${this.baseUrl}/decks/${deckId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deck),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update deck: ${errorData.detail || errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.deck || data;
    } catch (error) {
      console.error('Error updating deck:', error);
      throw error;
    }
  }

  async deleteDeck(deckId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/decks/${deckId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete deck: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      throw error;
    }
  }
}

export const deckService = new DeckService();
