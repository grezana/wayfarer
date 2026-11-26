import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  alpha,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { Place } from '../../db';
import { getCategoryMeta, getDateForTripDay } from './placeCategories';

interface ItineraryStopCardProps {
  place: Place;
  index: number;
  totalDays: number;
  tripStartDate: string;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEdit: (place: Place) => void;
  onMoveToDay: (place: Place, targetDay: number) => void;
  onDelete: (place: Place) => void;
}

export const ItineraryStopCard: React.FC<ItineraryStopCardProps> = ({
  place,
  index,
  totalDays,
  tripStartDate,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onEdit,
  onMoveToDay,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const meta = getCategoryMeta(place.category);

  const dayOptions = [0, ...Array.from({ length: totalDays }, (_, i) => i + 1)].filter(
    (d) => d !== place.day
  );

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      sx={{
        opacity: isDragging ? 0.45 : 1,
        borderColor: isDropTarget ? 'primary.main' : undefined,
        borderWidth: isDropTarget ? 2 : 1,
        transition: 'opacity 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
        cursor: 'grab',
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              pt: 0.25,
              color: 'text.secondary',
            }}
          >
            <DragIndicatorIcon fontSize="small" sx={{ opacity: 0.65 }} />
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: meta.color,
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {index + 1}
            </Box>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5, flexWrap: 'wrap' }}>
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
                  '& .MuiChip-icon': {
                    color: meta.color,
                    fontSize: 15,
                  },
                }}
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
            </Box>

            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
              {place.name}
            </Typography>

            {place.notes && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {place.notes}
              </Typography>
            )}
          </Box>

          <IconButton
            size="small"
            aria-label="Stop options"
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(e.currentTarget);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: { borderRadius: 3, minWidth: 190, maxHeight: 320 },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onEdit(place);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit stop</ListItemText>
        </MenuItem>

        <Divider />
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={700}
          sx={{ px: 2, py: 0.5, display: 'block' }}
        >
          MOVE TO DAY
        </Typography>

        {dayOptions.map((targetDay) => (
          <MenuItem
            key={targetDay}
            onClick={() => {
              setAnchorEl(null);
              onMoveToDay(place, targetDay);
            }}
          >
            <ListItemIcon>
              <DriveFileMoveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={targetDay === 0 ? 'Saved Ideas' : `Day ${targetDay}`}
              secondary={
                targetDay === 0
                  ? 'Unscheduled'
                  : getDateForTripDay(tripStartDate, targetDay)
              }
            />
          </MenuItem>
        ))}

        <Divider />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete(place);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove stop</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};
