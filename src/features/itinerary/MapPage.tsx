import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { usePlaces, useTrips, type Place } from '../../db';
import { getTripDurationDays } from '../trips/tripCovers';
import { getDateForTripDay } from './placeCategories';
import { createNumberedPinIcon, hasValidCoordinates } from './mapMarkers';
import { PlaceDetailSheet } from './PlaceDetailSheet';

const DEFAULT_CENTER: [number, number] = [1.3521, 103.8198];

interface MapBoundsUpdaterProps {
  places: Place[];
  selectedPlace: Place | null;
}

const MapBoundsUpdater: React.FC<MapBoundsUpdaterProps> = ({ places, selectedPlace }) => {
  const map = useMap();

  useEffect(() => {
    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 80);
    return () => window.clearTimeout(resizeTimer);
  }, [map]);

  useEffect(() => {
    if (selectedPlace && hasValidCoordinates(selectedPlace)) {
      map.flyTo([selectedPlace.lat, selectedPlace.lng], Math.max(map.getZoom(), 15), {
        duration: 0.45,
      });
      return;
    }

    if (places.length === 0) return;

    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 14, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [44, 44], maxZoom: 15, animate: true });
  }, [places, selectedPlace, map]);

  return null;
};

export const MapPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { trips, isLoading: tripsLoading } = useTrips();

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

  const { places, isLoading: placesLoading } = usePlaces(activeTripId);

  const [selectedDay, setSelectedDay] = useState<number | 'all'>(1);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);

  const totalDays = useMemo(() => {
    if (!activeTrip) return 1;
    return getTripDurationDays(activeTrip.startDate, activeTrip.endDate);
  }, [activeTrip]);

  useEffect(() => {
    setSelectedPlaceId(null);
    if (typeof selectedDay === 'number' && selectedDay > totalDays) {
      setSelectedDay(1);
    }
  }, [activeTripId, totalDays, selectedDay]);

  const filteredPlaces = useMemo(() => {
    const valid = places.filter(hasValidCoordinates);
    if (selectedDay === 'all') {
      return valid
        .filter((p) => p.day >= 1)
        .sort((a, b) => (a.day !== b.day ? a.day - b.day : a.order - b.order));
    }
    return valid
      .filter((p) => p.day === selectedDay)
      .sort((a, b) => a.order - b.order);
  }, [places, selectedDay]);

  const polylinePositions = useMemo<[number, number][]>(
    () => filteredPlaces.map((p) => [p.lat, p.lng]),
    [filteredPlaces]
  );

  const selectedPlaceIndex = useMemo(
    () => filteredPlaces.findIndex((p) => p.id === selectedPlaceId),
    [filteredPlaces, selectedPlaceId]
  );

  const selectedPlace =
    selectedPlaceIndex >= 0 ? filteredPlaces[selectedPlaceIndex] : null;

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
          <ExploreIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={700}>
            No trips to map yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 270 }}>
            Create a trip and add stops to visualize your daily walking and transit routes.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/trips')} sx={{ mt: 1 }}>
            Go to Trips
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 1.75, pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              select
              size="small"
              label="Active Trip"
              value={activeTripId ?? ''}
              onChange={(e) => {
                const nextId = e.target.value;
                setSearchParams({ tripId: String(nextId) });
                setSelectedPlaceId(null);
              }}
              fullWidth
              InputProps={{ sx: { borderRadius: 3 } }}
            >
              {trips.map((trip) => (
                <MenuItem key={trip.id} value={trip.id}>
                  {trip.name} ({trip.destination})
                </MenuItem>
              ))}
            </TextField>

            <Button
              size="small"
              variant="outlined"
              startIcon={<FormatListNumberedIcon />}
              onClick={() => navigate(`/trips/${activeTrip.id}`)}
              sx={{ flexShrink: 0, height: 40, px: 1.75 }}
            >
              Stops
            </Button>
          </Stack>
        </Box>

        <Tabs
          value={selectedDay}
          onChange={(_, val: number | 'all') => {
            setSelectedDay(val);
            setSelectedPlaceId(null);
          }}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: 1,
            borderTop: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 46,
              py: 0.75,
            },
          }}
        >
          {Array.from({ length: totalDays }, (_, idx) => idx + 1).map((dayNum) => {
            const count = places.filter(
              (p) => p.day === dayNum && hasValidCoordinates(p)
            ).length;
            return (
              <Tab
                key={dayNum}
                value={dayNum}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>Day {dayNum}</span>
                    {count > 0 && (
                      <Chip
                        size="small"
                        label={count}
                        sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }}
                      />
                    )}
                  </Box>
                }
              />
            );
          })}
          <Tab value="all" label="All Days" />
          <Tab value={0} label="Ideas" />
        </Tabs>
      </Card>

      <Card
        sx={{
          flex: 1,
          minHeight: 380,
          position: 'relative',
          overflow: 'hidden',
          '& .leaflet-container': {
            width: '100%',
            height: '100%',
            minHeight: 380,
            zIndex: 1,
            fontFamily: theme.typography.fontFamily,
          },
          '& .wayfarer-numbered-pin': {
            background: 'transparent',
            border: 'none',
          },
        }}
      >
        {placesLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 380,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={12}
            zoomControl={false}
            style={{ width: '100%', height: '100%', minHeight: 380 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapBoundsUpdater
              places={filteredPlaces}
              selectedPlace={selectedPlace}
            />

            {polylinePositions.length > 1 && selectedDay !== 0 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: theme.palette.primary.main,
                  weight: 4,
                  opacity: 0.85,
                  dashArray: '8, 8',
                }}
              />
            )}

            {filteredPlaces.map((place, index) => (
              <Marker
                key={place.id ?? `${place.name}-${index}`}
                position={[place.lat, place.lng]}
                icon={createNumberedPinIcon(
                  index,
                  place,
                  place.id !== undefined && place.id === selectedPlaceId
                )}
                eventHandlers={{
                  click: () => {
                    if (place.id !== undefined) {
                      setSelectedPlaceId(place.id);
                    }
                  },
                }}
              />
            ))}
          </MapContainer>
        )}

        <Box
          sx={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            right: 14,
            zIndex: 500,
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Chip
            label={
              filteredPlaces.length === 0
                ? selectedDay === 'all'
                  ? 'No mapped stops in this trip yet'
                  : selectedDay === 0
                    ? 'No mapped places in Saved Ideas'
                    : `No mapped stops on Day ${selectedDay} (${getDateForTripDay(
                        activeTrip.startDate,
                        selectedDay
                      )})`
                : `${filteredPlaces.length} ${
                    filteredPlaces.length === 1 ? 'stop' : 'stops'
                  } · Tap a pin for details`
            }
            sx={{
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0,0,0,0.16)',
            }}
          />
        </Box>
      </Card>

      <PlaceDetailSheet
        place={selectedPlace}
        stopIndex={selectedPlaceIndex}
        tripStartDate={activeTrip.startDate}
        onClose={() => setSelectedPlaceId(null)}
        onOpenItinerary={(id) => navigate(`/trips/${id}`)}
      />
    </Box>
  );
};
