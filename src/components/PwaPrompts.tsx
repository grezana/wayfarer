import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import IosShareIcon from '@mui/icons-material/IosShare';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  });

  const isIosSafari =
    typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream;

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'ios-guide' | 'unavailable'> => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
      return choice.outcome;
    }
    if (isIosSafari && !isInstalled) {
      return 'ios-guide';
    }
    return 'unavailable';
  };

  return {
    canInstall: !isInstalled && (Boolean(deferredPrompt) || isIosSafari),
    hasNativePrompt: Boolean(deferredPrompt),
    isIosSafari,
    isInstalled,
    promptInstall,
  };
}

export const PwaUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_, registration) {
      if (registration) {
        window.setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
  });

  return (
    <Snackbar
      open={needRefresh}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      message={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SystemUpdateIcon fontSize="small" />
          <span>New version of Wayfarer is ready</span>
        </Box>
      }
      action={
        <Stack direction="row" spacing={0.5}>
          <Button
            color="primary"
            size="small"
            variant="contained"
            onClick={() => updateServiceWorker(true)}
          >
            Update
          </Button>
          <Button
            color="inherit"
            size="small"
            onClick={() => setNeedRefresh(false)}
          >
            Later
          </Button>
        </Stack>
      }
      sx={{
        mt: 'env(safe-area-inset-top)',
      }}
    />
  );
};

interface IosInstallHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export const IosInstallHelpDialog: React.FC<IosInstallHelpDialogProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 4, bgcolor: 'background.default' } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>Install Wayfarer on iOS</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Install Wayfarer to your Home Screen for full-screen offline access:
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IosShareIcon color="primary" />
            <Typography variant="body2">
              1. Tap the <strong>Share</strong> button in Safari&apos;s toolbar.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AddBoxOutlinedIcon color="primary" />
            <Typography variant="body2">
              2. Scroll down and tap <strong>Add to Home Screen</strong>.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="contained" onClick={onClose}>
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};
