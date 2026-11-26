import { createTheme, alpha } from '@mui/material/styles';

export const getAppTheme = (mode: 'light' | 'dark') => {
  const isLight = mode === 'light';

  const primaryMain = isLight ? '#006A6A' : '#4DDADA';
  const primaryContainer = isLight ? '#CCE8E7' : '#004F4F';
  const onPrimaryContainer = isLight ? '#002020' : '#6FF7F6';

  const secondaryMain = isLight ? '#4A6363' : '#B0CCCB';
  const secondaryContainer = isLight ? '#CCE8E7' : '#324B4B';

  const backgroundDefault = isLight ? '#F4FBFB' : '#0E1515';
  const surfaceContainer = isLight ? '#E9F0F0' : '#1A2121';
  const surfaceContainerHigh = isLight ? '#E3EAEA' : '#252B2B';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primaryMain,
        light: primaryContainer,
        dark: isLight ? '#004F4F' : '#80E5E5',
        contrastText: isLight ? '#FFFFFF' : '#003737',
      },
      secondary: {
        main: secondaryMain,
        light: secondaryContainer,
        contrastText: isLight ? '#FFFFFF' : '#1B3435',
      },
      background: {
        default: backgroundDefault,
        paper: surfaceContainer,
      },
      text: {
        primary: isLight ? '#161D1D' : '#DEE4E3',
        secondary: isLight ? '#3F4948' : '#BEC9C8',
      },
      divider: isLight ? 'rgba(0, 106, 106, 0.12)' : 'rgba(77, 218, 218, 0.14)',
    },
    shape: {
      borderRadius: 20,
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      h4: {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 700,
        letterSpacing: '-0.015em',
      },
      h6: {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.01em',
      },
    },
    components: {
     MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: 44,
            minHeight: 44,
            '&:focus-visible': {
              outline: `2px solid ${primaryMain}`,
              outlineOffset: 2,
            },
          },
          sizeSmall: {
            minWidth: 40,
            minHeight: 40,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 48,
            minWidth: 64,
            '&:focus-visible': {
              outline: `2px solid ${primaryMain}`,
              outlineOffset: -2,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontWeight: 600,
          },
          clickable: {
            minHeight: 36,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: backgroundDefault,
            WebkitTapHighlightColor: 'transparent',
            overscrollBehaviorY: 'none',
          },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: 24,
            backgroundColor: surfaceContainer,
            border: `1px solid ${isLight ? 'rgba(0, 106, 106, 0.08)' : 'rgba(255, 255, 255, 0.06)'}`,
            transition: 'transform 0.18s ease, background-color 0.2s ease',
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 20,
            paddingBlock: 10,
          },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            backgroundColor: primaryContainer,
            color: onPrimaryContainer,
            boxShadow: isLight
              ? '0 6px 16px rgba(0, 106, 106, 0.18)'
              : '0 6px 20px rgba(0, 0, 0, 0.45)',
            '&:hover': {
              backgroundColor: alpha(primaryContainer, 0.88),
            },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            height: 72,
            backgroundColor: alpha(surfaceContainerHigh, 0.82),
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderTop: `1px solid ${isLight ? 'rgba(0, 106, 106, 0.1)' : 'rgba(255, 255, 255, 0.08)'}`,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: isLight ? '#3F4948' : '#BEC9C8',
            paddingTop: 8,
            paddingBottom: 10,
            '&.Mui-selected': {
              color: isLight ? '#002020' : '#6FF7F6',
              '& .MuiSvgIcon-root': {
                backgroundColor: primaryContainer,
                color: onPrimaryContainer,
                borderRadius: 999,
                padding: '4px 16px',
                width: 56,
                height: 32,
                transition: 'all 0.2s ease',
              },
            },
            '& .MuiSvgIcon-root': {
              width: 56,
              height: 32,
              padding: '4px 16px',
              borderRadius: 999,
            },
          },
          label: {
            fontSize: '0.75rem',
            fontWeight: 600,
            marginTop: 4,
            '&.Mui-selected': {
              fontSize: '0.75rem',
            },
          },
        },
      },
    },
  });
};
