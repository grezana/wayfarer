import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Fab,
  IconButton,
  LinearProgress,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import {
  useExpenses,
  useTrips,
  type Expense,
  type NewExpense,
} from '../../db';
import { formatCurrency } from '../trips/tripCovers';
import {
  EXPENSE_CATEGORIES,
  convertToTripCurrency,
  getExpenseCategoryMeta,
} from '../expenses/expenseCategories';
import { QuickExpenseSheet } from '../expenses/QuickExpenseSheet';
import { ExchangeRatesDialog } from './ExchangeRatesDialog';
import {
  BudgetCharts,
  type CategoryChartDatum,
  type DailyChartDatum,
} from './BudgetCharts';

export const BudgetPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { trips, isLoading: tripsLoading, updateTrip } = useTrips();

  const paramTripId = searchParams.get('tripId');
  const activeTripId = useMemo(() => {
    if (paramTripId && trips.some((t) => t.id === Number(paramTripId))) {
      return Number(paramTripId);
    }
    return trips[0]?.id;
  }, [paramTripId, trips]);

  const activeTrip = useMemo(
    () => trips.find((t) => t.id === activeTripId),
    [trips, activeTripId]
  );

  const {
    expenses,
    isLoading: expensesLoading,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses(activeTripId);

  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [ratesDialogOpen, setRatesDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const usedForeignCurrencies = useMemo(() => {
    if (!activeTrip) return [];
    const set = new Set<string>();
    expenses.forEach((exp) => {
      if (exp.currency !== activeTrip.currency) {
        set.add(exp.currency);
      }
    });
    return Array.from(set);
  }, [expenses, activeTrip]);

  const unconfiguredCurrencies = useMemo(() => {
    if (!activeTrip) return [];
    return usedForeignCurrencies.filter(
      (code) => !(activeTrip.exchangeRates && activeTrip.exchangeRates[code] > 0)
    );
  }, [usedForeignCurrencies, activeTrip]);

  const { totalSpent, categoryData, dailyData } = useMemo(() => {
    if (!activeTrip) {
      return { totalSpent: 0, categoryData: [], dailyData: [] };
    }

    let total = 0;
    const catTotals: Record<string, number> = {};
    const dayTotals: Record<string, number> = {};

    expenses.forEach((exp) => {
      const converted = convertToTripCurrency(exp.amount, exp.currency, activeTrip);
      total += converted;
      catTotals[exp.category] = (catTotals[exp.category] ?? 0) + converted;
      dayTotals[exp.date] = (dayTotals[exp.date] ?? 0) + converted;
    });

    const catChart: CategoryChartDatum[] = EXPENSE_CATEGORIES.map((meta) => ({
      category: meta.value,
      label: meta.label,
      value: Number((catTotals[meta.value] ?? 0).toFixed(2)),
      color: meta.color,
    }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    const dayChart: DailyChartDatum[] = Object.entries(dayTotals)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, amount]) => {
        const parsed = new Date(`${date}T00:00:00`);
        const label = Number.isNaN(parsed.getTime())
          ? date
          : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          date,
          label,
          amount: Number(amount.toFixed(2)),
        };
      });

    return {
      totalSpent: total,
      categoryData: catChart,
      dailyData: dayChart,
    };
  }, [expenses, activeTrip]);

  const budget = activeTrip?.budget ?? 0;
  const remaining = budget - totalSpent;
  const ratio = budget > 0 ? totalSpent / budget : 0;
  const progressPercent = Math.min(ratio * 100, 100);
  const isOverBudget = budget > 0 && ratio >= 1;
  const isNearBudget = budget > 0 && ratio >= 0.8 && ratio < 1;

  const handleSaveExpense = async (data: NewExpense, existingId?: number) => {
    if (existingId !== undefined) {
      await updateExpense(existingId, data);
      setToastMessage('Expense updated');
    } else {
      await addExpense(data);
      setToastMessage('Expense added');
    }
  };

  if (tripsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (trips.length === 0 || !activeTrip) {
    return (
      <Card
        sx={{
          mt: 2,
          borderStyle: 'dashed',
          borderWidth: 1.5,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.03),
        }}
      >
        <CardContent
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 1.5,
          }}
        >
          <AccountBalanceWalletIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={700}>
            No trips to budget yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 270 }}>
            Create a trip first to set a spending budget and log multi-currency expenses.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/trips')} sx={{ mt: 1 }}>
            Go to Trips
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
      <Card>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              select
              size="small"
              label="Active Trip"
              value={activeTripId ?? ''}
              onChange={(e) => setSearchParams({ tripId: String(e.target.value) })}
              fullWidth
              InputProps={{ sx: { borderRadius: 3 } }}
            >
              {trips.map((trip) => (
                <MenuItem key={trip.id} value={trip.id}>
                  {trip.name} ({trip.currency})
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              size="small"
              startIcon={<CurrencyExchangeIcon />}
              onClick={() => setRatesDialogOpen(true)}
              sx={{ flexShrink: 0, height: 40, px: 1.75 }}
            >
              FX Rates
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {isOverBudget && (
        <Alert severity="error" sx={{ borderRadius: 3, fontWeight: 500 }}>
          <strong>Over budget!</strong> You have exceeded your{' '}
          {formatCurrency(budget, activeTrip.currency)} budget by{' '}
          {formatCurrency(Math.abs(remaining), activeTrip.currency)} (
          {Math.round(ratio * 100)}%).
        </Alert>
      )}

      {isNearBudget && (
        <Alert severity="warning" sx={{ borderRadius: 3, fontWeight: 500 }}>
          <strong>Heads up — {Math.round(ratio * 100)}% of budget used.</strong> Only{' '}
          {formatCurrency(remaining, activeTrip.currency)} remaining.
        </Alert>
      )}

      {unconfiguredCurrencies.length > 0 && (
        <Alert
          severity="info"
          sx={{ borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setRatesDialogOpen(true)}>
              Set Rate
            </Button>
          }
        >
          Missing exchange rate for {unconfiguredCurrencies.join(', ')} (currently counted 1:1).
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              TOTAL SPENT
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Budget {formatCurrency(budget, activeTrip.currency)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
            <Typography variant="h4" fontWeight={700}>
              {formatCurrency(totalSpent, activeTrip.currency)}
            </Typography>
            {budget > 0 && (
              <Typography
                variant="body2"
                fontWeight={700}
                color={
                  isOverBudget
                    ? 'error.main'
                    : isNearBudget
                      ? 'warning.main'
                      : 'primary.main'
                }
              >
                {remaining >= 0
                  ? `${formatCurrency(remaining, activeTrip.currency)} left`
                  : `${formatCurrency(Math.abs(remaining), activeTrip.currency)} over`}
              </Typography>
            )}
          </Box>

          <LinearProgress
            variant="determinate"
            value={progressPercent}
            color={isOverBudget ? 'error' : isNearBudget ? 'warning' : 'primary'}
            sx={{
              height: 10,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
              },
            }}
          />

          {budget > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {Math.round(ratio * 100)}% used
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <BudgetCharts
        currency={activeTrip.currency}
        totalSpent={totalSpent}
        categoryData={categoryData}
        dailyData={dailyData}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5, mt: 0.5 }}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
          RECENT EXPENSES
        </Typography>
      </Box>

      {expensesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : expenses.length === 0 ? (
        <Card
          sx={{
            borderStyle: 'dashed',
            borderWidth: 1.5,
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <CardContent sx={{ p: 3.5, textAlign: 'center' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              No expenses recorded yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tap &ldquo;+ Expense&rdquo; to log meals, flights, transit, or shopping in any currency.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingExpense(null);
                setExpenseSheetOpen(true);
              }}
            >
              Add First Expense
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.25}>
          {expenses.map((expense) => {
            const meta = getExpenseCategoryMeta(expense.category);
            const isForeign = expense.currency !== activeTrip.currency;
            const converted = convertToTripCurrency(
              expense.amount,
              expense.currency,
              activeTrip
            );

            return (
              <Card
                key={expense.id}
                onClick={() => {
                  setEditingExpense(expense);
                  setExpenseSheetOpen(true);
                }}
                sx={{
                  cursor: 'pointer',
                  '&:active': { transform: 'scale(0.99)' },
                }}
              >
                <CardContent
                  sx={{
                    p: 2,
                    '&:last-child': { pb: 2 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 3,
                      bgcolor: alpha(meta.color, 0.15),
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {meta.icon}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {expense.note || meta.label}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                      <Chip
                        size="small"
                        label={meta.label}
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          bgcolor: alpha(meta.color, 0.12),
                          color: meta.color,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {expense.date}
                      </Typography>
                    </Stack>
                  </Box>

                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {formatCurrency(expense.amount, expense.currency)}
                    </Typography>
                    {isForeign && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        ≈ {formatCurrency(converted, activeTrip.currency)}
                      </Typography>
                    )}
                  </Box>

                  <IconButton
                    size="small"
                    aria-label="Delete expense"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (expense.id !== undefined) {
                        await deleteExpense(expense.id);
                        setToastMessage('Expense deleted');
                      }
                    }}
                    sx={{ color: 'text.secondary' }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <Fab
        variant="extended"
        aria-label="Add Expense"
        onClick={() => {
          setEditingExpense(null);
          setExpenseSheetOpen(true);
        }}
        sx={{
          position: 'fixed',
          bottom: 'calc(88px + env(safe-area-inset-bottom))',
          right: 20,
          zIndex: theme.zIndex.speedDial,
        }}
      >
        <AddIcon sx={{ mr: 1 }} />
        Expense
      </Fab>

      <QuickExpenseSheet
        open={expenseSheetOpen}
        trip={activeTrip}
        initialExpense={editingExpense}
        onClose={() => setExpenseSheetOpen(false)}
        onSave={handleSaveExpense}
      />

      <ExchangeRatesDialog
        open={ratesDialogOpen}
        trip={activeTrip}
        usedCurrencies={usedForeignCurrencies}
        onClose={() => setRatesDialogOpen(false)}
        onSaveRates={async (rates) => {
          if (activeTrip.id !== undefined) {
            await updateTrip(activeTrip.id, { exchangeRates: rates });
            setToastMessage('Exchange rates saved');
          }
        }}
      />

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage(null)}
        message={toastMessage ?? ''}
        sx={{ bottom: 'calc(88px + env(safe-area-inset-bottom))' }}
      />
    </Box>
  );
};
