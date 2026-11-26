import React, { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TableChartIcon from '@mui/icons-material/TableChart';
import StorageIcon from '@mui/icons-material/Storage';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, useTrips } from '../../db';
import {
  IosInstallHelpDialog,
  usePwaInstall,
} from '../../components/PwaPrompts';
import {
  exportExpensesCSV,
  exportWayfarerBackupJSON,
  importWayfarerBackupJSON,
} from './dataTransfer';

export const SettingsPage: React.FC = () => {
  const { trips } = useTrips();
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();

  const counts = useLiveQuery(async () => {
    const [tripCount, placeCount, expenseCount, checklistCount] = await Promise.all([
      db.trips.count(),
      db.places.count(),
      db.expenses.count(),
      db.checklistItems.count(),
    ]);
    return { tripCount, placeCount, expenseCount, checklistCount };
  }, []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedCsvTripId, setSelectedCsvTripId] = useState<string>('all');
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInstallApp = async () => {
    const outcome = await promptInstall();
    if (outcome === 'ios-guide') {
      setIosGuideOpen(true);
    } else if (outcome === 'accepted') {
      setToastMessage('Wayfarer installed!');
    }
  };

  const handleExportJSON = async () => {
    try {
      const payload = await exportWayfarerBackupJSON();
      setToastMessage(
        `Exported ${payload.data.trips.length} ${
          payload.data.trips.length === 1 ? 'trip' : 'trips'
        } to JSON`
      );
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to export backup');
    }
  };

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
    }
    e.target.value = '';
  };

  const handleConfirmImport = async (mode: 'merge' | 'replace') => {
    if (!pendingFile) return;
    const file = pendingFile;
    setPendingFile(null);
    setErrorMessage(null);

    try {
      const result = await importWayfarerBackupJSON(file, mode);
      setToastMessage(
        `Restored ${result.tripsCount} trips, ${result.placesCount} stops & ${result.expensesCount} expenses`
      );
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to import JSON backup');
    }
  };

  const handleExportCSV = async () => {
    try {
      const tripId = selectedCsvTripId === 'all' ? undefined : Number(selectedCsvTripId);
      const count = await exportExpensesCSV(tripId);
      setToastMessage(`Exported ${count} ${count === 1 ? 'expense' : 'expenses'} to CSV`);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to export CSV');
    }
  };

  return (
    <Stack spacing={2}>
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ borderRadius: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InstallMobileIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>
                App & Offline Mode
              </Typography>
            </Box>

            {isInstalled && (
              <Chip
                size="small"
                color="success"
                icon={<CheckCircleIcon sx={{ fontSize: 15 }} />}
                label="Installed"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: canInstall ? 2 : 0 }}>
            Wayfarer caches the app shell and visited OpenStreetMap tiles automatically so your itineraries and budgets work offline.
          </Typography>

          {canInstall && (
            <Button
              variant="contained"
              fullWidth
              startIcon={<InstallMobileIcon />}
              onClick={handleInstallApp}
            >
              Install Wayfarer App
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <StorageIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Offline Local Storage
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            All trips, itineraries, maps, and expenses are stored locally on this device in IndexedDB.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              textAlign: 'center',
            }}
          >
            {[
              { label: 'Trips', value: counts?.tripCount ?? 0 },
              { label: 'Stops', value: counts?.placeCount ?? 0 },
              { label: 'Expenses', value: counts?.expenseCount ?? 0 },
              { label: 'Checklist', value: counts?.checklistCount ?? 0 },
            ].map((stat) => (
              <Box
                key={stat.label}
                sx={{
                  p: 1.25,
                  borderRadius: 3,
                  bgcolor: 'background.default',
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            JSON Full Backup
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Download a complete snapshot of your trips, places, notes, documents, checklists, and expenses, or restore from a previous backup.
          </Typography>

          <Stack direction="row" spacing={1.25}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<DownloadIcon />}
              onClick={handleExportJSON}
            >
              Export JSON
            </Button>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Import JSON
            </Button>
          </Stack>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChosen}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <TableChartIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700}>
              CSV Expense Export
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Export expenses with original and converted currencies for Excel or Google Sheets.
          </Typography>

          <Stack spacing={1.5}>
            <TextField
              select
              size="small"
              label="Trip Scope"
              value={selectedCsvTripId}
              onChange={(e) => setSelectedCsvTripId(e.target.value)}
              fullWidth
              InputProps={{ sx: { borderRadius: 3 } }}
            >
              <MenuItem value="all">All Trips</MenuItem>
              {trips.map((trip) => (
                <MenuItem key={trip.id} value={String(trip.id)}>
                  {trip.name} ({trip.currency})
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
              disabled={(counts?.expenseCount ?? 0) === 0}
            >
              Download Expenses CSV
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(pendingFile)}
        onClose={() => setPendingFile(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 4, bgcolor: 'background.default' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Restore JSON Backup</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Selected file: <strong>{pendingFile?.name}</strong>
          </Typography>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body2" color="text.secondary">
            Choose whether to <strong>Merge</strong> matching records into your existing trips or <strong>Replace All</strong> local data with this backup.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setPendingFile(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleConfirmImport('replace')}
          >
            Replace All
          </Button>
          <Button variant="contained" onClick={() => handleConfirmImport('merge')}>
            Merge Data
          </Button>
        </DialogActions>
      </Dialog>

      <IosInstallHelpDialog
        open={iosGuideOpen}
        onClose={() => setIosGuideOpen(false)}
      />

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage(null)}
        message={toastMessage ?? ''}
        sx={{ bottom: 'calc(88px + env(safe-area-inset-bottom))' }}
      />
    </Stack>
  );
};
