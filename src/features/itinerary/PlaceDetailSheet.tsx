import React from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  SwipeableDrawer,
  Typography,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DirectionsIcon from '@mui/icons-material/Directions';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { Place } from '../../db';
import { getCategoryMeta, getDateForTripDay } from './placeCategories';

interface PlaceDetailSheetProps {
  place: Place | null;
  stopIndex: number;
  tripStartDate: string;
  onClose: () => void;
  onOpenItinerary: (tripId: number) => void;
}

export const PlaceDetailSheet: React.FC<PlaceDetailSheetProps> = ({
  place,
  stopIndex,
  tripStartDate,
  onClose,
  onOpenItinerary,
}) => {
  const meta = place ? getCategoryMeta(place.category) : null;

  const externalMapsUrl = place
    ? `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=17/${place.lat}/${place.lng}`
    : '#';

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={Boolean(place)}
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
      {place && meta && (
        <Box>
          <Box
            sx={{
              width: 36,
              height: 4,
              borderRadius: 999,
              bgcolor: 'text.disabled',
              mx: 'auto',
              mb: 2,
              opacity: 0.45,
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: meta.color,
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              {stopIndex + 1}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                <Chip
                  size="small"
                  icon={meta.icon}
                  label={meta.label}
                  sx={{
                    height: 24,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    bgcolor: alpha(meta.color, 0.14),
                    color: meta.color,
                    '& .MuiChip-icon': { color: meta.color, fontSize: 15 },
                  }}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={
                    place.day === 0
                      ? 'Saved Idea'
                      : `Day ${place.day} · ${getDateForTripDay(tripStartDate, place.day)}`
                  }
                  sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600 }}
                />
                {place.time && (
                  <Chip
                    size="small"
                    icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
                    label={place.time}
                    variant="outlined"
                    sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600 }}
                  />
                )}
              </Stack>

              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.25 }}>
                {place.name}
              </Typography>
            </Box>

            <IconButton size="small" onClick={onClose} aria-label="Close details">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {place.notes && (
            <Box
              sx={{
                mt: 2,
                p: 1.75,
                borderRadius: 3,
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-line' }}>
                {place.notes}
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              mt: 1.75,
              color: 'text.secondary',
            }}
          >
            <LocationOnIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={500}>
              {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.25} sx={{ mt: 2.25 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<FormatListNumberedIcon />}
              onClick={() => {
                onClose();
                onOpenItinerary(place.tripId);
              }}
            >
              Itinerary
            </Button>
            <Button
              variant="contained"
              fullWidth
              startIcon={<DirectionsIcon />}
              component="a"
              href={externalMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Map
            </Button>
          </Stack>
        </Box>
      )}
    </SwipeableDrawer>
  );
};
