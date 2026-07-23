import { useEffect, useRef } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onScan: (barcode: string) => void;
  autoFocus?: boolean;
}

export function BarcodeInput({ value, onChange, onScan, autoFocus }: BarcodeInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const lastScanRef = useRef<{ barcode: string; time: number }>({ barcode: '', time: 0 });

  const debouncedOnScan = (barcode: string) => {
    const now = Date.now();
    if (lastScanRef.current.barcode === barcode && now - lastScanRef.current.time < 500) {
      return;
    }
    lastScanRef.current = { barcode, time: now };
    onScan(barcode);
  };

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  // Global scanner listener: captures fast keystrokes ending with Enter
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('.MuiSelect-root') ||
        target.closest('.MuiAutocomplete-root');

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
        return;
      }

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          e.preventDefault();
          debouncedOnScan(buffer);
          onChange('');
          buffer = '';
        } else {
          buffer = '';
        }
        return;
      }

      if (e.key.length === 1) {
        if (timeDiff < 45 || buffer === '') {
          buffer += e.key;
        } else {
          buffer = isInput ? '' : e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [onChange, onScan]);

  // Click-to-focus helper with modal protection
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('.MuiSelect-root') ||
        target.closest('.MuiAutocomplete-root') ||
        target.closest('button') ||
        target.closest('a') ||
        document.querySelector('.MuiDialog-root') ||
        document.querySelector('.MuiModal-root')
      ) {
        return;
      }
      ref.current?.focus();
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // Blur refocus helper with modal and input protection
  useEffect(() => {
    const handleBlur = (e: FocusEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (
        relatedTarget && (
          relatedTarget.tagName === 'INPUT' ||
          relatedTarget.tagName === 'TEXTAREA' ||
          relatedTarget.tagName === 'SELECT' ||
          relatedTarget.isContentEditable ||
          relatedTarget.closest('.MuiSelect-root') ||
          relatedTarget.closest('.MuiAutocomplete-root') ||
          relatedTarget.closest('button') ||
          relatedTarget.closest('a')
        )
      ) {
        return;
      }
      if (
        document.querySelector('.MuiDialog-root') ||
        document.querySelector('.MuiModal-root')
      ) {
        return;
      }
      setTimeout(() => {
        if (
          !document.querySelector('.MuiDialog-root') &&
          !document.querySelector('.MuiModal-root')
        ) {
          ref.current?.focus();
        }
      }, 50);
    };

    const inputEl = ref.current;
    inputEl?.addEventListener('blur', handleBlur);
    return () => {
      inputEl?.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      debouncedOnScan(value.trim());
      onChange('');
      setTimeout(() => ref.current?.focus(), 50);
    }
  };

  return (
    <TextField
      inputRef={ref}
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Shtrix-kodni skanerlang yoki kiriting…"
      sx={{ '& .MuiOutlinedInput-root': { height: 56 } }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <QrCodeScannerIcon color="primary" />
          </InputAdornment>
        ),
      }}
      aria-label="Shtrix-kod"
    />
  );
}
