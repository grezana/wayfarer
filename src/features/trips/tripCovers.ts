export interface CoverPreset {
  id: string;
  label: string;
  gradient: string;
}

export const COVER_PRESETS: CoverPreset[] = [
  {
    id: 'teal-lagoon',
    label: 'Teal Lagoon',
    gradient: 'linear-gradient(135deg, #006A6A 0%, #004F4F 55%, #002020 100%)',
  },
  {
    id: 'sunset-coral',
    label: 'Sunset Coast',
    gradient: 'linear-gradient(135deg, #B3261E 0%, #9C4146 50%, #4A2532 100%)',
  },
  {
    id: 'alpine-fjord',
    label: 'Alpine Fjord',
    gradient: 'linear-gradient(135deg, #006493 0%, #1B4965 55%, #0D2538 100%)',
  },
  {
    id: 'bamboo-grove',
    label: 'Bamboo Grove',
    gradient: 'linear-gradient(135deg, #2E6B3E 0%, #1E4D2B 55%, #0E2916 100%)',
  },
  {
    id: 'amber-dunes',
    label: 'Amber Dunes',
    gradient: 'linear-gradient(135deg, #8F4E00 0%, #693C00 55%, #381E00 100%)',
  },
  {
    id: 'twilight-plum',
    label: 'Twilight City',
    gradient: 'linear-gradient(135deg, #6750A4 0%, #4F378B 55%, #21005D 100%)',
  },
];

export const CURRENCIES = [
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { code: 'THB', label: 'THB — Thai Baht' },
  { code: 'VND', label: 'VND — Vietnamese Dong' },
  { code: 'IDR', label: 'IDR — Indonesian Rupiah' },
  { code: 'KRW', label: 'KRW — South Korean Won' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
];

export function resolveCoverStyle(cover?: string): string {
  if (!cover) return COVER_PRESETS[0].gradient;
  const preset = COVER_PRESETS.find((p) => p.id === cover);
  if (preset) return preset.gradient;
  if (cover.startsWith('linear-gradient')) return cover;
  return `url("${cover}") center / cover no-repeat`;
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });

  const endStr = end.toLocaleDateString('en-US', {
    ...(sameMonth ? {} : { month: 'short' }),
    day: 'numeric',
    year: 'numeric',
  });

  return `${startStr} – ${endStr}`;
}

export function getTripDurationDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 1;
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'JPY' || currency === 'VND' || currency === 'IDR' || currency === 'KRW' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
