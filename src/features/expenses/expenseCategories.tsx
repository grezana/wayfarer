import React from 'react';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import type { ExpenseCategory, Trip } from '../../db';

export interface ExpenseCategoryMeta {
  value: ExpenseCategory;
  label: string;
  color: string;
  icon: React.ReactElement;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryMeta[] = [
  {
    value: 'food',
    label: 'Food & Drink',
    color: '#D96B00',
    icon: <RestaurantIcon fontSize="small" />,
  },
  {
    value: 'lodging',
    label: 'Lodging',
    color: '#5B4B8A',
    icon: <HotelIcon fontSize="small" />,
  },
  {
    value: 'flights',
    label: 'Flights',
    color: '#006493',
    icon: <FlightIcon fontSize="small" />,
  },
  {
    value: 'transit',
    label: 'Transit',
    color: '#006A6A',
    icon: <DirectionsTransitIcon fontSize="small" />,
  },
  {
    value: 'activities',
    label: 'Activities',
    color: '#2E6B3E',
    icon: <LocalActivityIcon fontSize="small" />,
  },
  {
    value: 'shopping',
    label: 'Shopping',
    color: '#A83256',
    icon: <ShoppingBagIcon fontSize="small" />,
  },
  {
    value: 'other',
    label: 'Other',
    color: '#4A6363',
    icon: <ReceiptLongIcon fontSize="small" />,
  },
];

export function getExpenseCategoryMeta(category: ExpenseCategory): ExpenseCategoryMeta {
  return (
    EXPENSE_CATEGORIES.find((c) => c.value === category) ??
    EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
  );
}

export function convertToTripCurrency(
  amount: number,
  expenseCurrency: string,
  trip: Pick<Trip, 'currency' | 'exchangeRates'>
): number {
  if (!expenseCurrency || expenseCurrency === trip.currency) {
    return amount;
  }
  const rate = trip.exchangeRates?.[expenseCurrency];
  if (rate !== undefined && Number.isFinite(rate) && rate > 0) {
    return amount * rate;
  }
  return amount;
}
