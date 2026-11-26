import Dexie, { type EntityTable } from 'dexie';
import type { Trip, Place, Expense, ChecklistItem } from './types';

export class WayfarerDatabase extends Dexie {
  trips!: EntityTable<Trip, 'id'>;
  places!: EntityTable<Place, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;
  checklistItems!: EntityTable<ChecklistItem, 'id'>;

  constructor() {
    super('WayfarerDB');

    this.version(1).stores({
      trips: '++id, name, destination, startDate, endDate, updatedAt',
      places: '++id, tripId, day, order, category, [tripId+day]',
      expenses: '++id, tripId, category, date, placeId, [tripId+category], [tripId+date]',
      checklistItems: '++id, tripId, completed, order, [tripId+completed]',
    });

    this.version(2).stores({
      trips: '++id, name, destination, startDate, endDate, updatedAt',
      places: '++id, tripId, day, order, category, [tripId+day]',
      expenses: '++id, tripId, category, date, placeId, [tripId+category], [tripId+date]',
      checklistItems: '++id, tripId, completed, order, [tripId+completed]',
    });

    this.version(3).stores({
      trips: '++id, name, destination, startDate, endDate, updatedAt',
      places: '++id, tripId, day, order, category, [tripId+day]',
      expenses: '++id, tripId, category, date, placeId, [tripId+category], [tripId+date]',
      checklistItems: '++id, tripId, completed, order, [tripId+completed]',
    });
  }

  async deleteTripCascade(tripId: number): Promise<void> {
    await this.transaction(
      'rw',
      [this.trips, this.places, this.expenses, this.checklistItems],
      async () => {
        await this.places.where('tripId').equals(tripId).delete();
        await this.expenses.where('tripId').equals(tripId).delete();
        await this.checklistItems.where('tripId').equals(tripId).delete();
        await this.trips.delete(tripId);
      }
    );
  }
}

export const db = new WayfarerDatabase();
export * from './types';
export * from './hooks';