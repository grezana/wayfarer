export type PlaceCategory =
  | 'sightseeing'
  | 'food'
  | 'lodging'
  | 'transit'
  | 'activity'
  | 'shopping'
  | 'other';

export type ExpenseCategory =
  | 'flights'
  | 'lodging'
  | 'food'
  | 'transit'
  | 'activities'
  | 'shopping'
  | 'other';

export type DocumentType = 'flight' | 'hotel' | 'ticket' | 'id' | 'other';

export interface TripDocument {
  id: string;
  title: string;
  type: DocumentType;
  reference?: string;
  details?: string;
}

export interface Trip {
  id?: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  currency: string;
  budget: number;
  exchangeRates?: Record<string, number>;
  notes?: string;
  documents?: TripDocument[];
  cover?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Place {
  id?: number;
  tripId: number;
  day: number;
  order: number;
  name: string;
  lat: number;
  lng: number;
  notes?: string;
  time?: string;
  category: PlaceCategory;
}

export interface Expense {
  id?: number;
  tripId: number;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string;
  note: string;
  placeId?: number;
  paidBy?: string;
}

export interface ChecklistItem {
  id?: number;
  tripId: number;
  text: string;
  completed: boolean;
  category?: string;
  order: number;
}

export type NewTrip = Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>;
export type NewPlace = Omit<Place, 'id'>;
export type NewExpense = Omit<Expense, 'id'>;
export type NewChecklistItem = Omit<ChecklistItem, 'id'>;
