import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { Trip } from '../../db';
import { CURRENCIES } from '../trips/tripCovers';

interface ExchangeRatesDialogProps {
  open: boolean;
  trip: Trip;
  usedCurrencies: string[];
  onClose: () => void;
  onSaveRates: (rates: Record<string, number>) => Promise<void>;
}

export const ExchangeRatesDialog: React.FC<ExchangeRatesDialogProps> = ({
  open,
  trip,
  usedCurrencies,
  onClose,
  onSaveRates,
}) => {
  const [rates, setRates] = useState<Record<string, string>>({});
  const [newCurrency, setNewCurrency] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};

    Object.entries(trip.exchangeRates ?? {}).forEach(([code, val]) => {
      if (code !== trip.currency) {
        initial[code] = String(val);
      }
    });

    usedCurrencies.forEach((code) => {
      if (code !== trip.currency && !(code in initial)) {
        initial[code] = '';
      }
    });

    setRates(initial);

    const firstAvailable = CURRENCIES.find(
      (c) => c.code !== trip.currency && !(c.code in initial)
    );
    setNewCurrency(firstAvailable?.code ?? '');
  }, [open, trip, usedCurrencies]);

  const availableCurrencies = CURRENCIES.filter(
    (c) => c.code !== trip.currency && !(c.code in rates)
  );

  const handleAddCurrency = () => {
    if (!newCurrency || newCurrency in rates) return;
    const updated = { ...rates, [newCurrency]: '' };
    setRates(updated);
    const next = CURRENCIES.find(
      (c) => c.code !== trip.currency && !(c.code in updated)
    );
    setNewCurrency(next?.code ?? '');
  };

  const handleRemoveCurrency = (code: string) => {
    const copy = { ...rates };
    delete copy[code];
    setRates(copy);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const parsed: Record<string, number> = {};
      Object.entries(rates).forEach(([code, valStr]) => {
        const num = Number(valStr);
        if (Number.isFinite(num) && num > 0) {
          parsed[code] = num;
        }
      });
      await onSaveRates(parsed);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const rateEntries = Object.entries(rates);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: { borderRadius: 4, bgcolor: 'background.default' },
      }}
    >
      <form onSubmit={handleSave}>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Exchange Rates
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Base trip currency: <strong>{trip.currency}</strong>
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Enter how much <strong>1 unit</strong> of a foreign currency equals in{' '}
              <strong>{trip.currency}</strong> (e.g., 1 JPY = 0.0088 {trip.currency}).
            </Typography>

            {rateEntries.length === 0 ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No foreign currencies added yet.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {rateEntries.map(([code, value]) => (
                  <Box key={code} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      label={`1 ${code} in ${trip.currency}`}
                      type="number"
                      placeholder="e.g. 1.35"
                      value={value}
                      onChange={(e) =>
                        setRates((prev) => ({ ...prev, [code]: e.target.value }))
                      }
                      fullWidth
                      size="small"
                      inputProps={{ min: 0.000001, step: 'any', inputMode: 'decimal' }}
                      InputProps={{
                        sx: { borderRadius: 3 },
                        endAdornment: (
                          <InputAdornment position="end">{trip.currency}</InputAdornment>
                        ),
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveCurrency(code)}
                      aria-label={`Remove ${code}`}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}

            {availableCurrencies.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select
                  size="small"
                  label="Add currency"
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  fullWidth
                  InputProps={{ sx: { borderRadius: 3 } }}
                >
                  {availableCurrencies.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      {c.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddCurrency}
                  sx={{ flexShrink: 0, height: 40 }}
                >
                  Add
                </Button>
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            Save Rates
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
