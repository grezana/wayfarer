import {
  db,
  type ChecklistItem,
  type Expense,
  type Place,
  type Trip,
} from '../../db';
import { convertToTripCurrency } from './expenseCategories';

export interface WayfarerBackupPayload {
  app: 'Wayfarer';
  version: number;
  exportedAt: string;
  data: {
    trips: Trip[];
    places: Place[];
    expenses: Expense[];
    checklistItems: ChecklistItem[];
  };
}

function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportWayfarerBackupJSON(): Promise<WayfarerBackupPayload> {
  const [trips, places, expenses, checklistItems] = await Promise.all([
    db.trips.toArray(),
    db.places.toArray(),
    db.expenses.toArray(),
    db.checklistItems.toArray(),
  ]);

  const payload: WayfarerBackupPayload = {
    app: 'Wayfarer',
    version: 3,
    exportedAt: new Date().toISOString(),
    data: {
      trips,
      places,
      expenses,
      checklistItems,
    },
  };

  const dateStamp = new Date().toISOString().split('T')[0];
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  triggerFileDownload(blob, `wayfarer-backup-${dateStamp}.json`);
  return payload;
}

export async function importWayfarerBackupJSON(
  file: File,
  mode: 'merge' | 'replace'
): Promise<{ tripsCount: number; placesCount: number; expensesCount: number }> {
  const rawText = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Invalid JSON file.');
  }

  const candidate = parsed as Partial<WayfarerBackupPayload>;
  if (
    candidate.app !== 'Wayfarer' ||
    !candidate.data ||
    !Array.isArray(candidate.data.trips) ||
    !Array.isArray(candidate.data.places) ||
    !Array.isArray(candidate.data.expenses)
  ) {
    throw new Error('File is not a valid Wayfarer backup.');
  }

  const trips = candidate.data.trips;
  const places = candidate.data.places;
  const expenses = candidate.data.expenses;
  const checklistItems = Array.isArray(candidate.data.checklistItems)
    ? candidate.data.checklistItems
    : [];

  await db.transaction(
    'rw',
    [db.trips, db.places, db.expenses, db.checklistItems],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.trips.clear(),
          db.places.clear(),
          db.expenses.clear(),
          db.checklistItems.clear(),
        ]);
      }

      if (trips.length > 0) await db.trips.bulkPut(trips);
      if (places.length > 0) await db.places.bulkPut(places);
      if (expenses.length > 0) await db.expenses.bulkPut(expenses);
      if (checklistItems.length > 0) await db.checklistItems.bulkPut(checklistItems);
    }
  );

  return {
    tripsCount: trips.length,
    placesCount: places.length,
    expensesCount: expenses.length,
  };
}

function escapeCSV(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
 if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportExpensesCSV(tripId?: number): Promise<number> {
  const trips = await db.trips.toArray();
  const tripMap = new Map<number, Trip>();
  trips.forEach((t) => {
    if (t.id !== undefined) tripMap.set(t.id, t);
  });

  const expenses =
    tripId !== undefined
      ? await db.expenses.where('tripId').equals(tripId).toArray()
      : await db.expenses.toArray();

  expenses.sort((a, b) => a.date.localeCompare(b.date));

  const headers = [
    'Date',
    'Trip',
    'Category',
    'Note',
    'Original Amount',
    'Original Currency',
    'Converted Amount',
    'Trip Base Currency',
  ];

  const rows = expenses.map((exp) => {
    const trip = tripMap.get(exp.tripId);
    const baseCurrency = trip?.currency ?? exp.currency;
    const converted = trip
      ? Number(convertToTripCurrency(exp.amount, exp.currency, trip).toFixed(2))
      : exp.amount;

    return [
      escapeCSV(exp.date),
      escapeCSV(trip?.name ?? `Trip #${exp.tripId}`),
      escapeCSV(exp.category),
      escapeCSV(exp.note),
      escapeCSV(exp.amount),
      escapeCSV(exp.currency),
      escapeCSV(converted),
      escapeCSV(baseCurrency),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const dateStamp = new Date().toISOString().split('T')[0];
  const selectedTrip = tripId !== undefined ? tripMap.get(tripId) : undefined;
  const slug = selectedTrip
    ? selectedTrip.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    : 'all-trips';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(blob, `wayfarer-expenses-${slug}-${dateStamp}.csv`);
  return expenses.length;
}
