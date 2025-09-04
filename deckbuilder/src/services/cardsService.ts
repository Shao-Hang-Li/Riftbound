import { Card } from '../types';

class CardsService {
  private baseUrl = '';

  async getCards(): Promise<Card[]> {
    try {
      const response = await fetch(`${this.baseUrl}/cards`);
      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.statusText}`);
      }
      const data = await response.json();
      return data.cards || [];
    } catch (error) {
      console.error('Error fetching cards:', error);
      throw error;
    }
  }

  async getCardById(cardId: string): Promise<Card | null> {
    try {
      const response = await fetch(`${this.baseUrl}/cards/${cardId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch card: ${response.statusText}`);
      }
      const data = await response.json();
      return data.card || null;
    } catch (error) {
      console.error('Error fetching card:', error);
      throw error;
    }
  }

  async searchCards(query: string): Promise<Card[]> {
    try {
      const response = await fetch(`${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Failed to search cards: ${response.statusText}`);
      }
      const data = await response.json();
      return data.cards || [];
    } catch (error) {
      console.error('Error searching cards:', error);
      throw error;
    }
  }
}

export const cardsService = new CardsService();
