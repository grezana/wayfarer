import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import type { NewTrip, Trip } from '../../db';
import { COVER_PRESETS, CURRENCIES } from './tripCovers';

interface TripFormDialogProps {
  open: boolean;
  initialTrip?: Trip | null;
  onClose: () => void;
  onSave: (data: NewTrip, existingId?: number) => Promise<void>;
}

const getTodayISO = () => new Date().toISOString().split('T')[0];

const getPlusDaysISO = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const TripFormDialog: React.FC<TripFormDialogProps> = ({
  open,
  initialTrip,
  onClose,
  onSave,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState(getPlusDaysISO(4));
  const [currency, setCurrency] = useState('SGD');
  const [budget, setBudget] = useState('1500');
  const [cover, setCover] = useState(COVER_PRESETS[0].id);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialTrip) {
      setName(initialTrip.name);
      setDestination(initialTrip.destination);
      setStartDate(initialTrip.startDate);
      setEndDate(initialTrip.endDate);
      setCurrency(initialTrip.currency);
      setBudget(String(initialTrip.budget));
      setCover(initialTrip.cover ?? COVER_PRESETS[0].id);
    } else {
      setName('');
      setDestination('');
      setStartDate(getTodayISO());
      setEndDate(getPlusDaysISO(4));
      setCurrency('SGD');
      setBudget('1500');
      setCover(COVER_PRESETS[0].id);
    }
  }, [open, initialTrip]);

  const dateInvalid = Boolean(startDate && endDate && endDate < startDate);
  const isFormValid =
    name.trim().length > 0 &&
    destination.trim().length > 0 &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    !dateInvalid &&
    Number(budget) >= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    try {
      await onSave(
        {
          name: name.trim(),
          destination: destination.trim(),
          startDate,
          endDate,
          currency,
          budget: Number(budget) || 0,
          cover,
        },
        initialTrip?.id
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
          bgcolor: 'background.default',
        },
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: isMobile ? 'calc(16px + env(safe-area-inset-top))' : 2.5,
            pb: 1.5,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {initialTrip ? 'Edit Trip' : 'Plan a New Trip'}
          </Typography>
          <IconButton onClick={onClose} edge="end" aria-label="Close dialog">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.25} sx={{ mt: 0.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                CARD THEME
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
                {COVER_PRESETS.map((preset) => {
                  const selected = cover === preset.id;
                  return (
                    <Box
                      key={preset.id}
                      onClick={() => setCover(preset.id)}
                      role="button"
                      tabIndex={0}
                      aria-label={preset.label}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setCover(preset.id);
                        }
                      }}
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 3,
                        background: preset.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: selected ? '2px solid' : '2px solid transparent',
                        borderColor: selected ? 'primary.main' : 'transparent',
                        transform: selected ? 'scale(1.06)' : 'scale(1)',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      {selected && <CheckIcon sx={{ color: '#FFFFFF', fontSize: 20 }} />}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <TextField
              label="Trip Name"
              placeholder="e.g., Kyoto Autumn Escape"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              autoFocus={!isMobile}
              InputProps={{ sx: { borderRadius: 3 } }}
            />

            <TextField
              label="Destination"
              placeholder="e.g., Kyoto & Osaka, Japan"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              fullWidth
              required
              InputProps={{ sx: { borderRadius: 3 } }}
            />

            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  const nextStart = e.target.value;
                  setStartDate(nextStart);
                  if (endDate && nextStart > endDate) {
                    setEndDate(nextStart);
                  }
                }}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: { borderRadius: 3 } }}
              />
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                required
                error={dateInvalid}
                helperText={dateInvalid ? 'Must be on or after start date' : undefined}
                inputProps={{ min: startDate }}
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <TextField
                select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                sx={{ minWidth: 130 }}
                InputProps={{ sx: { borderRadius: 3 } }}
              >
                {CURRENCIES.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.code}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Total Budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                fullWidth
                inputProps={{ min: 0, step: 'any' }}
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pt: 1.5,
            pb: isMobile ? 'calc(16px + env(safe-area-inset-bottom))' : 2.5,
            gap: 1,
          }}
        >
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isFormValid || submitting}
          >
            {initialTrip ? 'Save Changes' : 'Create Trip'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
