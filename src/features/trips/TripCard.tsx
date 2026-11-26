import React, { useState } from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  alpha,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { Trip } from '../../db';
import {
  formatCurrency,
  formatDateRange,
  getTripDurationDays,
  resolveCoverStyle,
} from './tripCovers';

interface TripCardProps {
  trip: Trip;
  onSelect: (trip: Trip) => void;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const days = getTripDurationDays(trip.startDate, trip.endDate);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        '&:active': {
          transform: 'scale(0.99)',
        },
      }}
    >
      <CardActionArea onClick={() => onSelect(trip)} sx={{ display: 'block' }}>
        <Box
          sx={{
            height: 118,
            background: resolveCoverStyle(trip.cover),
            position: 'relative',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip
              size="small"
              label={`${days} ${days === 1 ? 'day' : 'days'}`}
              sx={{
                bgcolor: alpha('#000000', 0.35),
                color: '#FFFFFF',
                backdropFilter: 'blur(8px)',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
          </Box>

          <Box sx={{ pr: 4 }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                color: '#FFFFFF',
                fontWeight: 700,
                textShadow: '0 1px 4px rgba(0,0,0,0.35)',
              }}
            >
              {trip.name}
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 2.25, pt: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              color: 'text.secondary',
              mb: 0.75,
            }}
          >
            <PlaceIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="body2" fontWeight={500} noWrap>
              {trip.destination}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              mt: 1.5,
              pt: 1.5,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
              <CalendarTodayIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption" fontWeight={500}>
                {formatDateRange(trip.startDate, trip.endDate)}
              </Typography>
            </Box>

            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={`Budget ${formatCurrency(trip.budget, trip.currency)}`}
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>
        </CardContent>
      </CardActionArea>

      <IconButton
        aria-label="Trip options"
        size="small"
        onClick={handleOpenMenu}
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          bgcolor: alpha('#000000', 0.35),
          color: '#FFFFFF',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            bgcolor: alpha('#000000', 0.55),
          },
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              minWidth: 160,
              mt: 0.5,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onEdit(trip);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit trip</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onDelete(trip);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};
