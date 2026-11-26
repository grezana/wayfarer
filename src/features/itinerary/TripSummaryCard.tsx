import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import type { ChecklistItem, Expense, Place, Trip } from '../../db';
import { formatCurrency, getTripDurationDays } from '../trips/tripCovers';
import { convertToTripCurrency } from '../expenses/expenseCategories';

interface TripSummaryCardProps {
  trip: Trip;
  places: Place[];
  expenses: Expense[];
  checklistItems: ChecklistItem[];
  onNavigateBudget: () => void;
  onSwitchSection: (section: 'itinerary' | 'checklist' | 'notes') => void;
}

export const TripSummaryCard: React.FC<TripSummaryCardProps> = ({
  trip,
  places,
  expenses,
  checklistItems,
  onNavigateBudget,
  onSwitchSection,
}) => {
  const theme = useTheme();

  const totalDays = getTripDurationDays(trip.startDate, trip.endDate);
  const scheduledStops = places.filter((p) => p.day >= 1).length;
  const packedCount = checklistItems.filter((i) => i.completed).length;
  const docCount = trip.documents?.length ?? 0;

  const totalSpent = useMemo(
    () =>
      expenses.reduce(
        (sum, exp) => sum + convertToTripCurrency(exp.amount, exp.currency, trip),
        0
      ),
    [expenses, trip]
  );

  const stats = [
    {
      label: 'Itinerary',
      value: `${scheduledStops} ${scheduledStops === 1 ? 'stop' : 'stops'}`,
      sub: `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`,
      icon: <PlaceIcon sx={{ fontSize: 18 }} />,
      onClick: () => onSwitchSection('itinerary'),
    },
    {
      label: 'Spent',
      value: formatCurrency(totalSpent, trip.currency),
      sub: `of ${formatCurrency(trip.budget, trip.currency)}`,
      icon: <AccountBalanceWalletIcon sx={{ fontSize: 18 }} />,
      onClick: onNavigateBudget,
    },
    {
      label: 'Packed',
      value: `${packedCount}/${checklistItems.length}`,
      sub: checklistItems.length === 0 ? 'Add items' : 'Checklist',
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />,
      onClick: () => onSwitchSection('checklist'),
    },
    {
      label: 'Docs',
      value: `${docCount}`,
      sub: trip.notes?.trim() ? 'Has notes' : 'Bookings',
      icon: <DescriptionOutlinedIcon sx={{ fontSize: 18 }} />,
      onClick: () => onSwitchSection('notes'),
    },
  ];

  return (
    <Card>
      <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1.25,
          }}
        >
          {stats.map((item) => (
            <Box
              key={item.label}
              onClick={item.onClick}
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: 'background.default',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  color: 'primary.main',
                  mb: 0.5,
                }}
              >
                {item.icon}
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  {item.label.toUpperCase()}
                </Typography>
              </Box>
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {item.value}
              </Typography>
              <Divider sx={{ my: 0.5, opacity: 0.5 }} />
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {item.sub}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};
