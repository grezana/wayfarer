import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './index';
import type {
  Trip,
  Place,
  Expense,
  ChecklistItem,
  NewTrip,
  NewPlace,
  NewExpense,
  NewChecklistItem,
} from './types';

export function useTrips() {
  const trips = useLiveQuery(
    () => db.trips.orderBy('startDate').reverse().toArray(),
    []
  );

  const addTrip = async (data: NewTrip): Promise<number> => {
    const now = Date.now();
    const id = await db.trips.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return id as number;
  };

  const updateTrip = async (id: number, changes: Partial<Omit<Trip, 'id' | 'createdAt'>>) => {
    await db.trips.update(id, {
      ...changes,
      updatedAt: Date.now(),
    });
  };

  const deleteTrip = async (id: number) => {
    await db.deleteTripCascade(id);
  };

  return {
    trips: trips ?? [],
    isLoading: trips === undefined,
    addTrip,
    updateTrip,
    deleteTrip,
  };
}

export function useTrip(tripId: number | undefined) {
  const trip = useLiveQuery(
    () => (tripId !== undefined ? db.trips.get(tripId) : undefined),
    [tripId]
  );

  return {
    trip,
    isLoading: tripId !== undefined && trip === undefined,
  };
}

export function usePlaces(tripId: number | undefined) {
  const places = useLiveQuery(async () => {
    if (tripId === undefined) return [];
    const items = await db.places.where('tripId').equals(tripId).toArray();
    return items.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.order - b.order;
    });
  }, [tripId]);

  const addPlace = async (data: NewPlace): Promise<number> => {
    const id = await db.places.add(data);
    await db.trips.update(data.tripId, { updatedAt: Date.now() });
    return id as number;
  };

  const updatePlace = async (id: number, changes: Partial<Omit<Place, 'id'>>) => {
    const existing = await db.places.get(id);
    await db.places.update(id, changes);
    if (existing) {
      await db.trips.update(existing.tripId, { updatedAt: Date.now() });
    }
  };

  const deletePlace = async (id: number) => {
    const existing = await db.places.get(id);
    await db.transaction('rw', [db.places, db.expenses, db.trips], async () => {
      await db.expenses.where('placeId').equals(id).modify({ placeId: undefined });
      await db.places.delete(id);
      if (existing) {
        await db.trips.update(existing.tripId, { updatedAt: Date.now() });
      }
    });
  };

  const reorderPlaces = async (updates: Array<{ id: number; day: number; order: number }>) => {
    await db.transaction('rw', db.places, async () => {
      for (const item of updates) {
        await db.places.update(item.id, { day: item.day, order: item.order });
      }
    });
  };

  return {
    places: places ?? [],
    isLoading: tripId !== undefined && places === undefined,
    addPlace,
    updatePlace,
    deletePlace,
    reorderPlaces,
  };
}

export function useExpenses(tripId: number | undefined) {
  const expenses = useLiveQuery(async () => {
    if (tripId === undefined) return [];
    const items = await db.expenses.where('tripId').equals(tripId).toArray();
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [tripId]);

  const addExpense = async (data: NewExpense): Promise<number> => {
    const id = await db.expenses.add(data);
    await db.trips.update(data.tripId, { updatedAt: Date.now() });
    return id as number;
  };

  const updateExpense = async (id: number, changes: Partial<Omit<Expense, 'id'>>) => {
    const existing = await db.expenses.get(id);
    await db.expenses.update(id, changes);
    if (existing) {
      await db.trips.update(existing.tripId, { updatedAt: Date.now() });
    }
  };

  const deleteExpense = async (id: number) => {
    const existing = await db.expenses.get(id);
    await db.expenses.delete(id);
    if (existing) {
      await db.trips.update(existing.tripId, { updatedAt: Date.now() });
    }
  };

  return {
    expenses: expenses ?? [],
    isLoading: tripId !== undefined && expenses === undefined,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}

export function useChecklist(tripId: number | undefined) {
  const items = useLiveQuery(async () => {
    if (tripId === undefined) return [];
    const list = await db.checklistItems.where('tripId').equals(tripId).toArray();
    return list.sort((a, b) => {
      if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
      return a.order - b.order;
    });
  }, [tripId]);

  const addChecklistItem = async (data: NewChecklistItem): Promise<number> => {
    const id = await db.checklistItems.add(data);
    return id as number;
  };

  const toggleChecklistItem = async (id: number) => {
    const item = await db.checklistItems.get(id);
    if (item) {
      await db.checklistItems.update(id, { completed: !item.completed });
    }
  };

  const updateChecklistItem = async (
    id: number,
    changes: Partial<Omit<ChecklistItem, 'id'>>
  ) => {
    await db.checklistItems.update(id, changes);
  };

  const deleteChecklistItem = async (id: number) => {
    await db.checklistItems.delete(id);
  };

  return {
    items: items ?? [],
    isLoading: tripId !== undefined && items === undefined,
    addChecklistItem,
    toggleChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
  };
}
