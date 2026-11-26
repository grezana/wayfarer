import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import BadgeIcon from '@mui/icons-material/Badge';
import DescriptionIcon from '@mui/icons-material/Description';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';
import type { DocumentType, Trip, TripDocument } from '../../db';

interface TripNotesDocsSectionProps {
  trip: Trip;
  onUpdateTrip: (
    id: number,
    changes: Partial<Pick<Trip, 'notes' | 'documents'>>
  ) => Promise<void>;
  onNotify: (msg: string) => void;
}

const DOC_TYPES: Array<{
  value: DocumentType;
  label: string;
  color: string;
  icon: React.ReactElement;
}> = [
  { value: 'flight', label: 'Flight', color: '#006493', icon: <FlightIcon fontSize="small" /> },
  { value: 'hotel', label: 'Hotel / Stay', color: '#5B4B8A', icon: <HotelIcon fontSize="small" /> },
  {
    value: 'ticket',
    label: 'Ticket / Pass',
    color: '#2E6B3E',
    icon: <ConfirmationNumberIcon fontSize="small" />,
  },
  { value: 'id', label: 'ID / Insurance', color: '#006A6A', icon: <BadgeIcon fontSize="small" /> },
  { value: 'other', label: 'Document', color: '#4A6363', icon: <DescriptionIcon fontSize="small" /> },
];

export const TripNotesDocsSection: React.FC<TripNotesDocsSectionProps> = ({
  trip,
  onUpdateTrip,
  onNotify,
}) => {
  const [notes, setNotes] = useState(trip.notes ?? '');
  const [notesDirty, setNotesDirty] = useState(false);

  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('flight');
  const [docRef, setDocRef] = useState('');
  const [docDetails, setDocDetails] = useState('');

  useEffect(() => {
    setNotes(trip.notes ?? '');
    setNotesDirty(false);
  }, [trip.id, trip.notes]);

  const documents = trip.documents ?? [];

  const handleSaveNotes = async () => {
    if (trip.id === undefined || !notesDirty) return;
    await onUpdateTrip(trip.id, { notes });
    setNotesDirty(false);
    onNotify('Trip notes saved');
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || trip.id === undefined) return;

    const newDoc: TripDocument = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: docTitle.trim(),
      type: docType,
      reference: docRef.trim() || undefined,
      details: docDetails.trim() || undefined,
    };

    await onUpdateTrip(trip.id, {
      documents: [newDoc, ...documents],
    });

    setDocTitle('');
    setDocType('flight');
    setDocRef('');
    setDocDetails('');
    setDocDialogOpen(false);
    onNotify('Document added');
  };

  const handleDeleteDocument = async (docId: string) => {
    if (trip.id === undefined) return;
    await onUpdateTrip(trip.id, {
      documents: documents.filter((d) => d.id !== docId),
    });
    onNotify('Document removed');
  };

  const handleCopyRef = async (refText: string) => {
    try {
      await navigator.clipboard.writeText(refText);
      onNotify(`Copied "${refText}"`);
    } catch {
      onNotify('Unable to copy');
    }
  };

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent sx={{ p: 2.25 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Bookings & Documents
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setDocDialogOpen(true)}
            >
              Add
            </Button>
          </Box>

          {documents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Save flight confirmation numbers, hotel check-in codes, eSIM details, or policy numbers for offline access.
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {documents.map((doc) => {
                const meta = DOC_TYPES.find((t) => t.value === doc.type) ?? DOC_TYPES[4];
                return (
                  <Box
                    key={doc.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      bgcolor: 'background.default',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.25,
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2.5,
                        bgcolor: alpha(meta.color, 0.14),
                        color: meta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    >
                      {meta.icon}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {doc.title}
                      </Typography>

                      {doc.reference && (
                        <Chip
                          size="small"
                          label={`Ref: ${doc.reference}`}
                          onClick={() => handleCopyRef(doc.reference!)}
                          onDelete={() => handleCopyRef(doc.reference!)}
                          deleteIcon={<ContentCopyIcon sx={{ fontSize: '14px !important' }} />}
                          sx={{
                            mt: 0.5,
                            height: 24,
                            fontWeight: 600,
                            fontFamily: 'monospace',
                          }}
                        />
                      )}

                      {doc.details && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.75, whiteSpace: 'pre-line' }}
                        >
                          {doc.details}
                        </Typography>
                      )}
                    </Box>

                    <IconButton
                      size="small"
                      aria-label="Delete document"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 2.25 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.25,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Trip Notes
            </Typography>
            {notesDirty && (
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={handleSaveNotes}
              >
                Save
              </Button>
            )}
          </Box>

          <TextField
            multiline
            minRows={5}
            maxRows={14}
            fullWidth
            placeholder="Jot down local phrases, emergency contacts, transit tips, or restaurant recommendations..."
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesDirty(true);
            }}
            onBlur={handleSaveNotes}
            InputProps={{
              sx: {
                borderRadius: 3,
                bgcolor: 'background.default',
              },
            }}
          />
        </CardContent>
      </Card>

      <Dialog
        open={docDialogOpen}
        onClose={() => setDocDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 4, bgcolor: 'background.default' } }}
      >
        <form onSubmit={handleAddDocument}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add Booking or Document</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <TextField
                select
                label="Type"
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                fullWidth
                InputProps={{ sx: { borderRadius: 3 } }}
              >
                {DOC_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Title"
                placeholder="e.g., SQ638 Outbound Flight, Hotel Check-in"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                required
                fullWidth
                autoFocus
                InputProps={{ sx: { borderRadius: 3 } }}
              />

              <TextField
                label="Booking / Reference Code (Optional)"
                placeholder="e.g., ABC123"
                value={docRef}
                onChange={(e) => setDocRef(e.target.value)}
                fullWidth
                InputProps={{ sx: { borderRadius: 3 } }}
              />

              <TextField
                label="Details (Optional)"
                placeholder="Terminal, check-in window, address, seat numbers..."
                value={docDetails}
                onChange={(e) => setDocDetails(e.target.value)}
                multiline
                minRows={2}
                fullWidth
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDocDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={!docTitle.trim()}>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
};
