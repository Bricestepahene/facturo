// src/stores/documentUiStore.ts
import { create } from 'zustand';

interface DocumentFilters {
  type?: 'invoice' | 'quote';
  status?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface DocumentUiState {
  activeTab: 'all' | 'invoice' | 'quote';
  filters: DocumentFilters;
  sortBy: 'date' | 'total' | 'number';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  selectedDocumentId: string | null;
  // Actions
  setActiveTab: (tab: 'all' | 'invoice' | 'quote') => void;
  setFilters: (filters: DocumentFilters) => void;
  resetFilters: () => void;
  setSort: (sortBy: 'date' | 'total' | 'number', sortOrder?: 'asc' | 'desc') => void;
  setSearchQuery: (query: string) => void;
  setSelectedDocument: (id: string | null) => void;
  clearSelection: () => void;
}

export const useDocumentUiStore = create<DocumentUiState>((set) => ({
  activeTab: 'all',
  filters: {},
  sortBy: 'date',
  sortOrder: 'desc',
  searchQuery: '',
  selectedDocumentId: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: {}, searchQuery: '', sortBy: 'date', sortOrder: 'desc' }),
  setSort: (sortBy, sortOrder = 'desc') => set({ sortBy, sortOrder }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDocument: (id) => set({ selectedDocumentId: id }),
  clearSelection: () => set({ selectedDocumentId: null }),
}));
