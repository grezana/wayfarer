import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Expense, ExpenseCategory, NewExpense, Trip } from '../../db';
import { CURRENCIES, formatCurrency } from '../trips/tripCovers';
import {
  EXPENSE_CATEGORIES,
  convertToTripCurrency,
} from './expenseCategories';

interface QuickExpenseSheetProps {
  open: boolean;
  trip: Trip;
  initialExpense?: Expense | null;
  onClose: () => void;
  onSave: (data: NewExpense, existingId?: number) => Promise<void>;
}

const getDefaultExpenseDate = (trip: Trip): string => {
  const today = new Date().toISOString().split('T')[0];
  if (today >= trip.startDate && today <= trip.endDate) return today;
  return trip.startDate;
};

export const QuickExpenseSheet: React.FC<QuickExpenseSheetProps> = ({
  open,
  trip,
  initialExpense,
  onClose,
  onSave,
}) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(trip.currency);
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [date, setDate] = useState(getDefaultExpenseDate(trip));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialExpense) {
      setAmount(String(initialExpense.amount));
      setCurrency(initialExpense.currency);
      setCategory(initialExpense.category);
      setDate(initialExpense.date);
      setNote(initialExpense.note);
    } else {
      setAmount('');
      const configuredForeign = Object.keys(trip.exchangeRates ?? {})[0];
      setCurrency(configuredForeign || trip.currency);
      setCategory('food');
      setDate(getDefaultExpenseDate(trip));
      setNote('');
    }
  }, [open, initialExpense, trip]);

  const numericAmount = Number(amount);
  const isValid = Number.isFinite(numericAmount) && numericAmount > 0 && Boolean(date);

  const isForeign = currency !== trip.currency;
  const hasConfiguredRate = Boolean(trip.exchangeRates?.[currency]);
  const convertedAmount = isValid
    ? convertToTripCurrency(numericAmount, currency, trip)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting || trip.id === undefined) return;

    setSubmitting(true);
    try {
      await onSave(
        {
          tripId: trip.id,
          amount: numericAmount,
          currency,
          category,
          date,
          note: note.trim(),
        },
        initialExpense?.id
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          bgcolor: 'background.default',
          maxWidth: 'sm',
          mx: 'auto',
          px: 2.5,
          pt: 1.25,
          pb: 'calc(24px + env(safe-area-inset-bottom))',
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Box
          sx={{
            width: 36,
            height: 4,
            borderRadius: 999,
            bgcolor: 'text.disabled',
            mx: 'auto',
            mb: 1.75,
            opacity: 0.45,
          }}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {initialExpense ? 'Edit Expense' : 'Quick Add Expense'}
          </Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Stack spacing={2.25}>
          <Stack direction="row" spacing={1.25}>
            <TextField
              select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              sx={{ minWidth: 112 }}
              InputProps={{ sx: { borderRadius: 3 } }}
            >
              {CURRENCIES.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.code}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
              required
              autoFocus
              inputProps={{ min: 0.01, step: 'any', inputMode: 'decimal' }}
              InputProps={{
                sx: {
                  borderRadius: 3,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                },
                endAdornment: isForeign && isValid && (
                  <InputAdornment position="end">
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {hasConfiguredRate
                        ? `≈ ${formatCurrency(convertedAmount, trip.currency)}`
                        : '1:1 (Set rate)'}
                    </Typography>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              sx={{ display: 'block', mb: 1 }}
            >
              CATEGORY
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const selected = category === cat.value;
                return (
                  <Chip
                    key={cat.value}
                    icon={cat.icon}
                    label={cat.label}
                    onClick={() => setCategory(cat.value)}
                    variant={selected ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 600,
                      bgcolor: selected ? cat.color : 'transparent',
                      color: selected ? '#FFFFFF' : 'text.primary',
                      borderColor: selected ? cat.color : 'divider',
                      '& .MuiChip-icon': {
                        color: selected ? '#FFFFFF' : cat.color,
                      },
                      '&:hover': {
                        bgcolor: selected ? cat.color : undefined,
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          <Stack direction="row" spacing={1.25}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              sx={{ minWidth: 150 }}
              required
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { borderRadius: 3 } }}
            />

            <TextField
              label="Note"
              placeholder="e.g., Ramen lunch, Subway pass..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              InputProps={{ sx: { borderRadius: 3 } }}
            />
          </Stack>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={!isValid || submitting}
            sx={{ mt: 0.5, py: 1.4 }}
          >
            {initialExpense ? 'Save Expense' : 'Add Expense'}
          </Button>
        </Stack>
      </form>
    </SwipeableDrawer>
  );
};
