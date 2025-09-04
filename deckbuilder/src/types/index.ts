// Re-export all types from Card.ts
export * from './Card';

// Additional common types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FilterOptions {
  searchTerm: string;
  selectedSet: string;
  selectedType: string;
  selectedRarity: string;
  selectedColor: string;
  selectedCost: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}