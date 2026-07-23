import * as ExcelJS from 'exceljs';
import { ReportExportFormat } from '@prisma/client';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportInput {
  title: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  summary?: Record<string, unknown>;
  totals?: Record<string, unknown>;
  format: ReportExportFormat;
}

export interface ExportResult {
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

export async function exportReport(input: ExportInput): Promise<ExportResult> {
  switch (input.format) {
    case ReportExportFormat.XLSX:
      return exportExcel(input);
    case ReportExportFormat.PDF:
      return exportPdf(input);
    case ReportExportFormat.CSV:
      return exportCsv(input);
    default:
      return exportCsv(input);
  }
}

async function exportExcel(input: ExportInput): Promise<ExportResult> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ERP Reports';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Report');
  sheet.columns = input.columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 18,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  for (const row of input.rows) {
    const values: Record<string, unknown> = {};
    for (const col of input.columns) {
      values[col.key] = row[col.key] ?? '';
    }
    sheet.addRow(values);
  }

  if (input.totals && Object.keys(input.totals).length > 0) {
    sheet.addRow({});
    const totalsRow = sheet.addRow(
      input.columns.map((c, i) => (i === 0 ? 'TOTALS' : String(input.totals![c.key] ?? ''))),
    );
    totalsRow.font = { bold: true };
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return {
    buffer,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx',
  };
}

async function exportCsv(input: ExportInput): Promise<ExportResult> {
  const escape = (v: unknown): string => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines: string[] = [];
  lines.push(input.columns.map((c) => escape(c.header)).join(','));
  for (const row of input.rows) {
    lines.push(input.columns.map((c) => escape(row[c.key])).join(','));
  }

  const bom = '\uFEFF';
  const buffer = Buffer.from(bom + lines.join('\n'), 'utf-8');
  return { buffer, mimeType: 'text/csv; charset=utf-8', extension: 'csv' };
}

async function exportPdf(input: ExportInput): Promise<ExportResult> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFDocument = require('pdfkit') as typeof import('pdfkit');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      resolve({
        buffer: Buffer.concat(chunks),
        mimeType: 'application/pdf',
        extension: 'pdf',
      });
    });
    doc.on('error', reject);

    doc.fontSize(16).text(input.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(8).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });
    doc.moveDown();

    const colWidth = (doc.page.width - 80) / Math.min(input.columns.length, 8);
    const displayCols = input.columns.slice(0, 8);

    doc.fontSize(7).font('Helvetica-Bold');
    let x = 40;
    for (const col of displayCols) {
      doc.text(col.header, x, doc.y, { width: colWidth, continued: false });
      x += colWidth;
    }
    doc.moveDown(0.5);
    doc.font('Helvetica');

    const maxRows = Math.min(input.rows.length, 500);
    for (let i = 0; i < maxRows; i++) {
      const row = input.rows[i];
      x = 40;
      const y = doc.y;
      if (y > doc.page.height - 60) {
        doc.addPage();
      }
      for (const col of displayCols) {
        doc.text(String(row[col.key] ?? ''), x, doc.y === y ? y : doc.y, {
          width: colWidth,
          continued: false,
        });
        x += colWidth;
      }
      doc.moveDown(0.3);
    }

    if (input.rows.length > maxRows) {
      doc.moveDown();
      doc.text(`... and ${input.rows.length - maxRows} more rows`, { align: 'center' });
    }

    doc.end();
  });
}

export function inferColumns(rows: Record<string, unknown>[]): ExportColumn[] {
  if (rows.length === 0) return [{ header: 'No Data', key: 'message' }];
  const keys = Object.keys(rows[0]);
  return keys.map((k) => ({
    header: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
    key: k,
  }));
}
