import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Fab,
  IconButton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import MapIcon from '@mui/icons-material/Map';
import ExploreIcon from '@mui/icons-material/Explore';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ChecklistIcon from '@mui/icons-material/Checklist';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import {
  useChecklist,
  useExpenses,
  usePlaces,
  useTrip,
  useTrips,
  type NewPlace,
  type Place,
} from '../../db';
import {
  formatDateRange,
  getTripDurationDays,
  resolveCoverStyle,
} from '../trips/tripCovers';
import { getDateForTripDay } from './placeCategories';
import { ItineraryStopCard } from './ItineraryStopCard';
import { PlaceFormDialog } from './PlaceFormDialog';
import { TripSummaryCard } from './TripSummaryCard';
import { TripChecklistSection } from './TripChecklistSection';
import { TripNotesDocsSection } from './TripNotesDocsSection';

type TripSection = 'itinerary' | 'checklist' | 'notes';

export const TripDetailPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const numericTripId = tripId ? Number(tripId) : undefined;
  const navigate = useNavigate();
  const theme = useTheme();

  const { trip, isLoading: tripLoading } = useTrip(numericTripId);
  const { updateTrip } = useTrips();
  const {
    places,
    isLoading: placesLoading,
    addPlace,
    updatePlace,
    deletePlace,
    reorderPlaces,
  } = usePlaces(numericTripId);
  const { expenses } = useExpenses(numericTripId);
  const { items: checklistItems } = useChecklist(numericTripId);

  const [section, setSection] = useState<TripSection>('itinerary');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  const [draggedPlaceId, setDraggedPlaceId] = useState<number | null>(null);
  const [dropTargetPlaceId, setDropTargetPlaceId] = useState<number | null>(null);
  const [dropTargetTabDay, setDropTargetTabDay] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalDays = useMemo(() => {
    if (!trip) return 1;
    return getTripDurationDays(trip.startDate, trip.endDate);
  }, [trip]);

  const activeDay = selectedDay > totalDays ? 1 : selectedDay;

  const dayPlaces = useMemo(
    () =>
      places
        .filter((p) => p.day === activeDay)
        .sort((a, b) => a.order - b.order),
    [places, activeDay]
  );

  const handleOpenAdd = () => {
    setEditingPlace(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (place: Place) => {
    setEditingPlace(place);
    setDialogOpen(true);
  };

  const handleSavePlace = async (data: NewPlace, existingId?: number) => {
    if (existingId !== undefined) {
      await updatePlace(existingId, data);
      setToastMessage(`Updated "${data.name}"`);
    } else {
      await addPlace(data);
      setToastMessage(`Added "${data.name}"`);
    }
    setSelectedDay(data.day);
  };

  const handleMoveToDay = async (place: Place, targetDay: number) => {
    if (place.id === undefined) return;
    const targetDayCount = places.filter((p) => p.day === targetDay).length;
    await updatePlace(place.id, {
      day: targetDay,
      order: targetDayCount,
    });
    setToastMessage(
      targetDay === 0
        ? `Moved "${place.name}" to Saved Ideas`
        : `Moved "${place.name}" to Day ${targetDay}`
    );
  };

  const handleDropOnCard = async (targetPlace: Place) => {
    if (
      draggedPlaceId === null ||
      targetPlace.id === undefined ||
      draggedPlaceId === targetPlace.id
    ) {
      setDraggedPlaceId(null);
      setDropTargetPlaceId(null);
      return;
    }

    const currentList = [...dayPlaces];
    const fromIdx = currentList.findIndex((p) => p.id === draggedPlaceId);
    const toIdx = currentList.findIndex((p) => p.id === targetPlace.id);

    if (fromIdx === -1 || toIdx === -1) return;

    const [moved] = currentList.splice(fromIdx, 1);
    currentList.splice(toIdx, 0, moved);

    const updates = currentList
      .filter((p): p is Place & { id: number } => p.id !== undefined)
      .map((p, idx) => ({
        id: p.id,
        day: activeDay,
        order: idx,
      }));

    setDraggedPlaceId(null);
    setDropTargetPlaceId(null);
    await reorderPlaces(updates);
  };

  const handleDropOnDayTab = async (targetDay: number) => {
    if (draggedPlaceId === null) return;
    const draggedPlace = places.find((p) => p.id === draggedPlaceId);
    setDraggedPlaceId(null);
    setDropTargetTabDay(null);

    if (!draggedPlace || draggedPlace.day === targetDay) return;
    await handleMoveToDay(draggedPlace, targetDay);
  };

  if (tripLoading || placesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!trip || numericTripId === undefined) {
    return (
      <Card>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Trip not found
          </Typography>
          <Button variant="contained" onClick={() => navigate('/trips')} sx={{ mt: 1 }}>
            Back to Trips
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
      <Card sx={{ overflow: 'hidden' }}>
        <Box
          sx={{
            background: resolveCoverStyle(trip.cover),
            p: 2.25,
            color: '#FFFFFF',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <IconButton
              size="small"
              onClick={() => navigate('/trips')}
              aria-label="Back to trips"
              sx={{
                bgcolor: alpha('#000000', 0.32),
                color: '#FFFFFF',
                '&:hover': { bgcolor: alpha('#000000', 0.5) },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>

            <Button
              size="small"
              startIcon={<MapIcon />}
              onClick={() => navigate(`/map?tripId=${trip.id}`)}
              sx={{
                bgcolor: alpha('#000000', 0.35),
                color: '#FFFFFF',
                backdropFilter: 'blur(8px)',
                px: 1.75,
                py: 0.5,
                '&:hover': { bgcolor: alpha('#000000', 0.5) },
              }}
            >
              View Map
            </Button>
          </Box>

          <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            {trip.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {trip.destination} · {formatDateRange(trip.startDate, trip.endDate)}
          </Typography>
        </Box>
      </Card>

      <TripSummaryCard
        trip={trip}
        places={places}
        expenses={expenses}
        checklistItems={checklistItems}
        onNavigateBudget={() => navigate(`/budget?tripId=${trip.id}`)}
        onSwitchSection={setSection}
      />

      <ToggleButtonGroup
        value={section}
        exclusive
        fullWidth
        onChange={(_, next: TripSection | null) => {
          if (next) setSection(next);
        }}
        sx={{
          bgcolor: 'background.paper',
          p: 0.5,
          borderRadius: 999,
          border: 1,
          borderColor: 'divider',
          '& .MuiToggleButton-root': {
            border: 'none',
            borderRadius: '999px !important',
            py: 0.85,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.82rem',
            gap: 0.75,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.main',
              },
            },
          },
        }}
      >
        <ToggleButton value="itinerary">
          <FormatListNumberedIcon fontSize="small" />
          Itinerary
        </ToggleButton>
        <ToggleButton value="checklist">
          <ChecklistIcon fontSize="small" />
          Packing
        </ToggleButton>
        <ToggleButton value="notes">
          <DescriptionOutlinedIcon fontSize="small" />
          Notes & Docs
        </ToggleButton>
      </ToggleButtonGroup>

      {section === 'itinerary' && (
        <>
          <Card sx={{ overflow: 'hidden' }}>
            <Tabs
              value={activeDay}
              onChange={(_, val: number) => setSelectedDay(val)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                px: 1,
                bgcolor: 'background.paper',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  minHeight: 54,
                  borderRadius: 2,
                  my: 0.5,
                },
              }}
            >
              {Array.from({ length: totalDays }, (_, idx) => idx + 1).map((dayNum) => {
                const count = places.filter((p) => p.day === dayNum).length;
                const isTabDropTarget = dropTargetTabDay === dayNum;
                return (
                  <Tab
                    key={dayNum}
                    value={dayNum}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropTargetTabDay(dayNum);
                    }}
                    onDragLeave={() => setDropTargetTabDay(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropOnDayTab(dayNum);
                    }}
                    sx={{
                      bgcolor: isTabDropTarget
                        ? alpha(theme.palette.primary.main, 0.16)
                        : undefined,
                    }}
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.68rem' }}
                        >
                          {getDateForTripDay(trip.startDate, dayNum)}
                        </Typography>
                      </Box>
                    }
                  />
                );
              })}

              <Tab
                value={0}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTargetTabDay(0);
                }}
                onDragLeave={() => setDropTargetTabDay(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnDayTab(0);
                }}
                label={
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>Ideas</span>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                      Unscheduled
                    </Typography>
                  </Box>
                }
              />
            </Tabs>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
              {activeDay === 0
                ? 'SAVED IDEAS'
                : `DAY ${activeDay} · ${getDateForTripDay(trip.startDate, activeDay).toUpperCase()}`}
            </Typography>
            {dayPlaces.length > 1 && (
              <Typography variant="caption" color="text.secondary">
                Drag cards to reorder
              </Typography>
            )}
          </Box>

          {dayPlaces.length === 0 ? (
            <Card
              sx={{
                borderStyle: 'dashed',
                borderWidth: 1.5,
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.primary.main, 0.03),
              }}
            >
              <CardContent
                sx={{
                  p: 3.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 1.25,
                }}
              >
                <ExploreIcon sx={{ fontSize: 34, color: 'primary.main', opacity: 0.85 }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  {activeDay === 0 ? 'No saved ideas yet' : `Nothing planned for Day ${activeDay}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 270 }}>
                  Search restaurants, landmarks, or hotels to build out your route.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAdd}
                  sx={{ mt: 0.5 }}
                >
                  Add Place
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={1.5}>
              {dayPlaces.map((place, index) => (
                <ItineraryStopCard
                  key={place.id}
                  place={place}
                  index={index}
                  totalDays={totalDays}
                  tripStartDate={trip.startDate}
                  isDragging={draggedPlaceId === place.id}
                  isDropTarget={dropTargetPlaceId === place.id}
                  onDragStart={() => {
                    if (place.id !== undefined) setDraggedPlaceId(place.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (place.id !== undefined && place.id !== draggedPlaceId) {
                      setDropTargetPlaceId(place.id);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOnCard(place);
                  }}
                  onDragEnd={() => {
                    setDraggedPlaceId(null);
                    setDropTargetPlaceId(null);
                  }}
                  onEdit={handleOpenEdit}
                  onMoveToDay={handleMoveToDay}
                  onDelete={async (p) => {
                    if (p.id !== undefined) {
                      await deletePlace(p.id);
                      setToastMessage(`Removed "${p.name}"`);
                    }
                  }}
                />
              ))}
            </Stack>
          )}

          <Fab
            variant="extended"
            aria-label="Add Place"
            onClick={handleOpenAdd}
            sx={{
              position: 'fixed',
              bottom: 'calc(88px + env(safe-area-inset-bottom))',
              right: 20,
              zIndex: theme.zIndex.speedDial,
            }}
          >
            <AddIcon sx={{ mr: 1 }} />
            Add Place
          </Fab>
        </>
      )}

      {section === 'checklist' && <TripChecklistSection tripId={numericTripId} />}

      {section === 'notes' && (
        <TripNotesDocsSection
          trip={trip}
          onUpdateTrip={updateTrip}
          onNotify={(msg) => setToastMessage(msg)}
        />
      )}

      <PlaceFormDialog
        open={dialogOpen}
        tripId={numericTripId}
        tripStartDate={trip.startDate}
        totalDays={totalDays}
        defaultDay={activeDay}
        nextOrder={dayPlaces.length}
        initialPlace={editingPlace}
        destinationHint={trip.destination}
        onClose={() => setDialogOpen(false)}
        onSave={handleSavePlace}
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
