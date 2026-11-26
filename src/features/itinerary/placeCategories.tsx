import React from 'react';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HotelIcon from '@mui/icons-material/Hotel';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PushPinIcon from '@mui/icons-material/PushPin';
import type { PlaceCategory } from '../../db';

export interface CategoryMeta {
  value: PlaceCategory;
  label: string;
  color: string;
  icon: React.ReactElement;
}

export const PLACE_CATEGORIES: CategoryMeta[] = [
  {
    value: 'sightseeing',
    label: 'Sightseeing',
    color: '#006A6A',
    icon: <CameraAltIcon fontSize="small" />,
  },
  {
    value: 'food',
    label: 'Food & Drink',
    color: '#C25900',
    icon: <RestaurantIcon fontSize="small" />,
  },
  {
    value: 'lodging',
    label: 'Lodging',
    color: '#5B4B8A',
    icon: <HotelIcon fontSize="small" />,
  },
  {
    value: 'transit',
    label: 'Transit',
    color: '#006493',
    icon: <DirectionsTransitIcon fontSize="small" />,
  },
  {
    value: 'activity',
    label: 'Activity',
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
    icon: <PushPinIcon fontSize="small" />,
  },
];

export function getCategoryMeta(category: PlaceCategory): CategoryMeta {
  return (
    PLACE_CATEGORIES.find((c) => c.value === category) ??
    PLACE_CATEGORIES[PLACE_CATEGORIES.length - 1]
  );
}

export function getDateForTripDay(startDate: string, dayNumber: number): string {
  if (dayNumber <= 0 || !startDate) return 'Unscheduled';
  const base = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return `Day ${dayNumber}`;
  base.setDate(base.getDate() + (dayNumber - 1));
  return base.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
