import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Toolbar,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import MapIcon from '@mui/icons-material/Map';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TuneIcon from '@mui/icons-material/Tune';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import {
  IosInstallHelpDialog,
  PwaUpdatePrompt,
  usePwaInstall,
} from './PwaPrompts';

const NAV_ITEMS = [
  { label: 'Trips', path: '/trips', icon: <ExploreIcon /> },
  { label: 'Map', path: '/map', icon: <MapIcon /> },
  { label: 'Budget', path: '/budget', icon: <AccountBalanceWalletIcon /> },
  { label: 'Settings', path: '/settings', icon: <TuneIcon /> },
];

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { canInstall, promptInstall } = usePwaInstall();

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [iosGuideOpen, setIosGuideOpen] = useState(false);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    const result = await promptInstall();
    if (result === 'ios-guide') {
      setIosGuideOpen(true);
    }
  };

  const currentTab = NAV_ITEMS.findIndex((item) =>
    location.pathname.startsWith(item.path)
  );

  const activeTitle =
    NAV_ITEMS[currentTab >= 0 ? currentTab : 0]?.label ?? 'Wayfarer';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        bgcolor: 'background.default',
      }}
    >
      <PwaUpdatePrompt />

      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.default, 0.8),
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary',
          pt: 'env(safe-area-inset-top)',
        }}
      >
        <Toolbar sx={{ minHeight: 60, justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            {activeTitle === 'Trips' ? 'Wayfarer' : activeTitle}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            {!isOnline && (
              <Chip
                size="small"
                color="warning"
                icon={<CloudOffIcon sx={{ fontSize: 15 }} />}
                label="Offline"
                sx={{ fontWeight: 600 }}
              />
            )}

            {canInstall && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<InstallMobileIcon fontSize="small" />}
                onClick={handleInstallClick}
                sx={{ py: 0.4, px: 1.5, fontSize: '0.78rem' }}
              >
                Install
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        maxWidth="sm"
        sx={{
          flex: 1,
          pt: 2,
          pb: 'calc(88px + env(safe-area-inset-bottom))',
          px: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </Container>

      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          pb: 'env(safe-area-inset-bottom)',
          bgcolor: 'transparent',
        }}
      >
        <BottomNavigation
          showLabels
          value={currentTab === -1 ? 0 : currentTab}
          onChange={(_, newValue: number) => {
            navigate(NAV_ITEMS[newValue].path);
          }}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>

      <IosInstallHelpDialog
        open={iosGuideOpen}
        onClose={() => setIosGuideOpen(false)}
      />
    </Box>
  );
};
