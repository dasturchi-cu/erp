import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { productsApi } from '@/api/services';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { parseProductImportFile, validateImportRowsLocal, type ParsedProductImportRow } from '@/utils/spreadsheet';

interface ProductImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ProductImportDialog({ open, onClose, onImported }: ProductImportDialogProps) {
  const { success, error: notifyError } = useNotification();
  const warehouses = useInventoryStore((s) => s.warehouses);
  const [rows, setRows] = useState<ParsedProductImportRow[]>([]);
  const [preview, setPreview] = useState<Array<{ row: number; sku: string; valid: boolean; errors: string[] }>>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const parsed = await parseProductImportFile(buffer, file.name);
    setRows(parsed);
    setPreview(validateImportRowsLocal(parsed));
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    try {
      const result = await productsApi.import({
        warehouseId: warehouseId || undefined,
        rows: rows.map((r) => ({
          sku: r.sku,
          barcode: r.barcode,
          name: r.name,
          category: r.category,
          unit: r.unit,
          purchasePrice: r.purchasePrice,
          sellingPrice: r.sellingPrice,
          purchasePriceUzs: r.purchasePriceUzs,
          sellingPriceUzs: r.sellingPriceUzs,
          purchasePriceUsd: r.purchasePriceUsd,
          sellingPriceUsd: r.sellingPriceUsd,
          legacyId: r.legacyId,
          stock: r.stock,
        })),
      });
      console.log('=== PRODUCTION IMPORT REPORT ===', result.report);
      success(`${result.created} ta mahsulot muvaffaqiyatli import qilindi!`);
      onImported();
      onClose();
      setRows([]);
      setPreview([]);
    } catch {
      notifyError('Importda xatolik');
    } finally {
      setImporting(false);
    }
  };

  const validCount = preview.filter((p) => p.valid).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Excel import</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Button variant="outlined" component="label">
            Fayl tanlash (.xlsx, .csv)
            <input
              type="file"
              hidden
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </Button>
          <Typography variant="caption" color="text.secondary">
            Ustunlar: SKU, Barcode, Name, Category, Unit, Purchase Price UZS, Selling Price UZS, Purchase Price USD, Selling Price USD, Legacy ID, Stock
          </Typography>
          {rows.some((r) => r.stock && Number(r.stock) > 0) && (
            <TextField
              select
              label="Ombor (zaxira uchun)"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              size="small"
            >
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </TextField>
          )}
          {preview.length > 0 && (
            <>
              <Typography variant="body2">
                Ko&apos;rib chiqish: {validCount} / {preview.length} qator to&apos;g&apos;ri
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Holat</TableCell>
                    <TableCell>Xatolar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.map((p) => (
                    <TableRow key={p.row}>
                      <TableCell>{p.row}</TableCell>
                      <TableCell>{p.sku}</TableCell>
                      <TableCell>{p.valid ? 'OK' : 'Xato'}</TableCell>
                      <TableCell>{p.errors.join(', ') || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Bekor</Button>
        <Button variant="contained" disabled={!validCount || importing} onClick={() => void handleImport()}>
          Import ({validCount})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
