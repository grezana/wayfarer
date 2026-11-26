import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import SearchIcon from '@mui/icons-material/Search';
import PlaceIcon from '@mui/icons-material/Place';
import type { NewPlace, Place, PlaceCategory } from '../../db';
import { PLACE_CATEGORIES, getDateForTripDay } from './placeCategories';

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  type?: string;
}

interface PlaceFormDialogProps {
  open: boolean;
  tripId: number;
  tripStartDate: string;
  totalDays: number;
  defaultDay: number;
  nextOrder: number;
  initialPlace?: Place | null;
  destinationHint?: string;
  onClose: () => void;
  onSave: (data: NewPlace, existingId?: number) => Promise<void>;
}

export const PlaceFormDialog: React.FC<PlaceFormDialogProps> = ({
  open,
  tripId,
  tripStartDate,
  totalDays,
  defaultDay,
  nextOrder,
  initialPlace,
  destinationHint,
  onClose,
  onSave,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [name, setName] = useState('');
  const [day, setDay] = useState<number>(defaultDay);
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('sightseeing');
  const [lat, setLat] = useState<string>('0');
  const [lng, setLng] = useState<string>('0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearchResults([]);
    if (initialPlace) {
      setName(initialPlace.name);
      setSearchQuery(initialPlace.name);
      setDay(initialPlace.day);
      setTime(initialPlace.time ?? '');
      setCategory(initialPlace.category);
      setLat(String(initialPlace.lat));
      setLng(String(initialPlace.lng));
      setNotes(initialPlace.notes ?? '');
    } else {
      setName('');
      setSearchQuery('');
      setDay(defaultDay);
      setTime('');
      setCategory('sightseeing');
      setLat('0');
      setLng('0');
      setNotes('');
    }
  }, [open, initialPlace, defaultDay]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!open || trimmed.length < 3 || trimmed === initialPlace?.name) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const queryWithContext =
          destinationHint && !trimmed.toLowerCase().includes(destinationHint.toLowerCase())
            ? `${trimmed}, ${destinationHint}`
            : trimmed;

        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          queryWithContext
        )}&limit=6&addressdetails=1`;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });
        if (!res.ok) throw new Error('Search failed');
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSearchResults([]);
        }
      } finally {
        setSearching(false);
      }
    }, 420);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, open, destinationHint, initialPlace?.name]);

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  const coordsValid =
    !Number.isNaN(parsedLat) &&
    !Number.isNaN(parsedLng) &&
    parsedLat >= -90 &&
    parsedLat <= 90 &&
    parsedLng >= -180 &&
    parsedLng <= 180;

  const isFormValid = name.trim().length > 0 && coordsValid;

  const handleSelectNominatim = (option: string | NominatimResult | null) => {
    if (!option) return;
    if (typeof option === 'string') {
      setName(option);
      return;
    }
    const shortName = option.name?.trim() || option.display_name.split(',')[0].trim();
    setName(shortName);
    setLat(Number(option.lat).toFixed(6));
    setLng(Number(option.lon).toFixed(6));
    if (!notes && option.display_name !== shortName) {
      setNotes(option.display_name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    try {
      await onSave(
        {
          tripId,
          day,
          order: initialPlace && initialPlace.day === day ? initialPlace.order : nextOrder,
          name: name.trim(),
          lat: parsedLat,
          lng: parsedLng,
          time: time.trim() || undefined,
          category,
          notes: notes.trim() || undefined,
        },
        initialPlace?.id
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
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
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
            {initialPlace ? 'Edit Stop' : 'Add Place to Itinerary'}
          </Typography>
          <IconButton onClick={onClose} edge="end" aria-label="Close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.25} sx={{ mt: 0.5 }}>
            <Autocomplete
              freeSolo
              options={searchResults}
              loading={searching}
              filterOptions={(x) => x}
              getOptionLabel={(opt) =>
                typeof opt === 'string' ? opt : opt.display_name
              }
              inputValue={searchQuery}
              onInputChange={(_, newValue) => {
                setSearchQuery(newValue);
                setName(newValue);
              }}
              onChange={(_, value) => handleSelectNominatim(value)}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <Box
                    component="li"
                    key={option.place_id}
                    {...rest}
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, py: 1 }}
                  >
                    <PlaceIcon
                      sx={{ color: 'primary.main', fontSize: 20, mt: 0.3, flexShrink: 0 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {option.name || option.display_name.split(',')[0]}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {option.display_name}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search place (OpenStreetMap)"
                  placeholder="e.g., Fushimi Inari Taisha, Café, Hotel..."
                  required
                  autoFocus={!isMobile}
                  InputProps={{
                    ...params.InputProps,
                    sx: { borderRadius: 3 },
                    startAdornment: (
                      <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                    ),
                    endAdornment: (
                      <>
                        {searching ? <CircularProgress color="primary" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

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
                {PLACE_CATEGORIES.map((cat) => {
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

            <Stack direction="row" spacing={1.5}>
              <TextField
                select
                label="Day"
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                fullWidth
                InputProps={{ sx: { borderRadius: 3 } }}
              >
                <MenuItem value={0}>Saved Ideas (Unscheduled)</MenuItem>
                {Array.from({ length: totalDays }, (_, idx) => idx + 1).map((d) => (
                  <MenuItem key={d} value={d}>
                    Day {d} · {getDateForTripDay(tripStartDate, d)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Time (Optional)"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                sx={{ minWidth: 145 }}
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Latitude"
                type="number"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                fullWidth
                inputProps={{ step: 'any' }}
                InputProps={{ sx: { borderRadius: 3 } }}
              />
              <TextField
                label="Longitude"
                type="number"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                fullWidth
                inputProps={{ step: 'any' }}
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </Stack>

            <TextField
              label="Notes & Address"
              placeholder="Booking confirmation, opening hours, must-try dishes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              InputProps={{ sx: { borderRadius: 3 } }}
            />
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
          <Button type="submit" variant="contained" disabled={!isFormValid || submitting}>
            {initialPlace ? 'Save Stop' : 'Add Stop'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
