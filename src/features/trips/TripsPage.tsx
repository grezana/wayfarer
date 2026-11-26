import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Fab,
  Snackbar,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LuggageIcon from '@mui/icons-material/Luggage';
import {
  db,
  useTrips,
  type ChecklistItem,
  type Expense,
  type NewTrip,
  type Place,
  type Trip,
} from '../../db';
import { TripCard } from './TripCard';
import { TripFormDialog } from './TripFormDialog';

interface DeletedTripSnapshot {
  trip: Trip;
  places: Place[];
  expenses: Expense[];
  checklistItems: ChecklistItem[];
}

export const TripsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { trips, isLoading, addTrip, updateTrip, deleteTrip } = useTrips();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deletedSnapshot, setDeletedSnapshot] = useState<DeletedTripSnapshot | null>(null);

  const handleOpenCreate = () => {
    setEditingTrip(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setDialogOpen(true);
  };

  const handleSaveTrip = async (data: NewTrip, existingId?: number) => {
    if (existingId !== undefined) {
      await updateTrip(existingId, data);
    } else {
      await addTrip(data);
    }
  };

  const handleDeleteTrip = async (trip: Trip) => {
    if (trip.id === undefined) return;
    const tripId = trip.id;

    const [places, expenses, checklistItems] = await Promise.all([
      db.places.where('tripId').equals(tripId).toArray(),
      db.expenses.where('tripId').equals(tripId).toArray(),
      db.checklistItems.where('tripId').equals(tripId).toArray(),
    ]);

    await deleteTrip(tripId);
    setDeletedSnapshot({ trip, places, expenses, checklistItems });
  };

  const handleUndoDelete = async () => {
    if (!deletedSnapshot) return;
    const { trip, places, expenses, checklistItems } = deletedSnapshot;

    await db.transaction(
      'rw',
      [db.trips, db.places, db.expenses, db.checklistItems],
      async () => {
        await db.trips.put(trip);
        if (places.length > 0) await db.places.bulkPut(places);
        if (expenses.length > 0) await db.expenses.bulkPut(expenses);
        if (checklistItems.length > 0) await db.checklistItems.bulkPut(checklistItems);
      }
    );

    setDeletedSnapshot(null);
  };

  const handleSelectTrip = (trip: Trip) => {
    if (trip.id !== undefined) {
      navigate(`/trips/${trip.id}`);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
      {trips.length === 0 ? (
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
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 4,
                bgcolor: 'primary.light',
                color: theme.palette.mode === 'light' ? '#002020' : '#6FF7F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 0.5,
              }}
            >
              <LuggageIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              No trips yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
              Start planning your next getaway with day-by-day itineraries, offline maps, and expense tracking.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{ mt: 1 }}
            >
              Create First Trip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
              {trips.length} {trips.length === 1 ? 'TRIP' : 'TRIPS'}
            </Typography>
          </Box>

          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onSelect={handleSelectTrip}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteTrip}
            />
          ))}
        </Stack>
      )}

      <Fab
        variant="extended"
        aria-label="New Trip"
        onClick={handleOpenCreate}
        sx={{
          position: 'fixed',
          bottom: 'calc(88px + env(safe-area-inset-bottom))',
          right: 20,
          zIndex: theme.zIndex.speedDial,
        }}
      >
        <AddIcon sx={{ mr: 1 }} />
        New Trip
      </Fab>

      <TripFormDialog
        open={dialogOpen}
        initialTrip={editingTrip}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveTrip}
      />

      <Snackbar
        open={Boolean(deletedSnapshot)}
        autoHideDuration={5000}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          setDeletedSnapshot(null);
        }}
        message={
          deletedSnapshot
            ? `Deleted "${deletedSnapshot.trip.name}"`
            : ''
        }
        action={
          <Button color="primary" size="small" onClick={handleUndoDelete}>
            Undo
          </Button>
        }
        sx={{
          bottom: 'calc(88px + env(safe-area-inset-bottom))',
        }}
      />
    </Box>
  );
};
