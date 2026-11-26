import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { useChecklist } from '../../db';

interface TripChecklistSectionProps {
  tripId: number;
}

const CHECKLIST_CATEGORIES = ['Essentials', 'Clothing', 'Tech', 'Documents', 'Toiletries'];

const STARTER_PACKING_ITEMS: Array<{ text: string; category: string }> = [
  { text: 'Passport & travel insurance PDF', category: 'Documents' },
  { text: 'Universal travel adapter & charger', category: 'Tech' },
  { text: 'Power bank & charging cables', category: 'Tech' },
  { text: 'Local currency / travel card', category: 'Essentials' },
  { text: 'Daily medications & basic first-aid', category: 'Essentials' },
  { text: 'Comfortable walking shoes', category: 'Clothing' },
];

export const TripChecklistSection: React.FC<TripChecklistSectionProps> = ({ tripId }) => {
  const theme = useTheme();
  const { items, addChecklistItem, toggleChecklistItem, deleteChecklistItem } =
    useChecklist(tripId);

  const [text, setText] = useState('');
  const [category, setCategory] = useState('Essentials');
  const [adding, setAdding] = useState(false);

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || adding) return;

    setAdding(true);
    try {
      await addChecklistItem({
        tripId,
        text: trimmed,
        category,
        completed: false,
        order: items.length,
      });
      setText('');
    } finally {
      setAdding(false);
    }
  };

  const handleAddStarterPack = async () => {
    const existingTexts = new Set(items.map((i) => i.text.toLowerCase()));
    let nextOrder = items.length;
    for (const starter of STARTER_PACKING_ITEMS) {
      if (!existingTexts.has(starter.text.toLowerCase())) {
        await addChecklistItem({
          tripId,
          text: starter.text,
          category: starter.category,
          completed: false,
          order: nextOrder++,
        });
      }
    }
  };

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent sx={{ p: 2.25 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Packing & Prep Checklist
            </Typography>
            <Chip
              size="small"
              color={progress === 100 && items.length > 0 ? 'success' : 'primary'}
              label={`${completedCount} / ${items.length} packed`}
              sx={{ fontWeight: 600 }}
            />
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              '& .MuiLinearProgress-bar': { borderRadius: 999 },
            }}
          />

          <Box component="form" onSubmit={handleAdd} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                placeholder="Add item to pack..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                fullWidth
                InputProps={{ sx: { borderRadius: 3 } }}
              />
              <TextField
                select
                size="small"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={{ minWidth: 118 }}
                InputProps={{ sx: { borderRadius: 3 } }}
              >
                {CHECKLIST_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                type="submit"
                variant="contained"
                disabled={!text.trim() || adding}
                sx={{ minWidth: 44, px: 1.5 }}
                aria-label="Add checklist item"
              >
                <AddIcon />
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card
          sx={{
            borderStyle: 'dashed',
            borderWidth: 1.5,
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <PlaylistAddCheckIcon sx={{ fontSize: 34, color: 'primary.main', mb: 0.5 }} />
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Empty packing list
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add your own items above or load a starter travel essentials list.
            </Typography>
            <Button variant="outlined" onClick={handleAddStarterPack}>
              Load Travel Essentials
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
            {items.map((item) => (
              <Box
                key={item.id}
                onClick={() => item.id !== undefined && toggleChecklistItem(item.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Checkbox
                  checked={item.completed}
                  onChange={() => item.id !== undefined && toggleChecklistItem(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  color="primary"
                />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{
                      textDecoration: item.completed ? 'line-through' : 'none',
                      color: item.completed ? 'text.secondary' : 'text.primary',
                    }}
                  >
                    {item.text}
                  </Typography>
                  {item.category && (
                    <Typography variant="caption" color="text.secondary">
                      {item.category}
                    </Typography>
                  )}
                </Box>

                <IconButton
                  size="small"
                  aria-label="Delete item"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.id !== undefined) deleteChecklistItem(item.id);
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
};
