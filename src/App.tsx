import React, { Suspense, lazy, useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Box, CircularProgress, CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { getAppTheme } from './theme/theme';
import { AppLayout } from './components/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

const TripsPage = lazy(() =>
  import('./features/trips/TripsPage').then((m) => ({ default: m.TripsPage }))
);
const TripDetailPage = lazy(() =>
  import('./features/itinerary/TripDetailPage').then((m) => ({ default: m.TripDetailPage }))
);
const MapPage = lazy(() =>
  import('./features/itinerary/MapPage').then((m) => ({ default: m.MapPage }))
);
const BudgetPage = lazy(() =>
  import('./features/budget/BudgetPage').then((m) => ({ default: m.BudgetPage }))
);
const SettingsPage = lazy(() =>
  import('./features/expenses/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const RouteFallback: React.FC = () => (
  <Box
    role="status"
    aria-label="Loading view"
    sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 8 }}
  >
    <CircularProgress />
  </Box>
);

export const App: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(
    () => getAppTheme(prefersDarkMode ? 'dark' : 'light'),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/trips" replace />} />
                <Route path="/trips" element={<TripsPage />} />
                <Route path="/trips/:tripId" element={<TripDetailPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/budget" element={<BudgetPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;