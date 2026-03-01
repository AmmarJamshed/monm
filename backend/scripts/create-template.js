#!/usr/bin/env node
/**
 * Create monm-template.xlsm with kill-switch VBA macro.
 * Requires: pip install vbaProject-Compiler (or clone from github.com/Beakerboy/vbaProject-Compiler)
 * Then: node scripts/create-template.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, '..', 'templates');
const vbaPath = path.join(templatesDir, 'Workbook_Open.vba');
const vbaBinPath = path.join(templatesDir, 'vbaProject.bin');
const outPath = path.join(templatesDir, 'monm-template.xlsm');

// Create minimal workbook with _MonM sheet (placeholder - will be overwritten per-download)
const wb = XLSX.utils.book_new();
const monmSheet = XLSX.utils.aoa_to_sheet([['FINGERPRINT'], ['https://monm-api.onrender.com']]);
XLSX.utils.book_append_sheet(wb, monmSheet, '_MonM');

// Add vbaProject.bin if it exists (from vbaProject-Compiler or MS-OVBA/tests/blank)
if (fs.existsSync(vbaBinPath)) {
  wb.vbaraw = new Uint8Array(fs.readFileSync(vbaBinPath));
  XLSX.writeFile(wb, outPath, { bookType: 'xlsm', bookVBA: true });
  console.log('Created', outPath, 'with VBA blob');
} else {
  XLSX.writeFile(wb, outPath.replace('.xlsm', '-no-macro.xlsx'));
  console.log('No vbaProject.bin. Download from: https://github.com/Beakerboy/MS-OVBA/raw/main/tests/blank/vbaProject.bin');
  console.log('Save to', vbaBinPath, 'and run again. Or use Workbook_Open.vba with vbaProject-Compiler.');
}
