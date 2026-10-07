import type { FormDocument } from './types';

/**
 * Mock data: SBI Customer Account Opening Form (Part-I), version SBI-AOF-VER4-DEC2023,
 * purpose "Open a new account". Coordinates are taken from the Figma frame
 * "Thunaiy — Form Viewer (Core Screen)" (sheet origin = top-left of the page-1 sheet, 366 x 537.25).
 */
export const sbiAccountOpening: FormDocument = {
  bank: 'State Bank of India',
  form: 'Account Opening Form',
  version: 'SBI-AOF-VER4-DEC2023',
  purposeLabel: 'New Account',
  pages: [
    { page: 1, width: 366, height: 537.25, artwork: 'sbi-aof-page-1', sheetClass: 'rounded-[2px] bg-white shadow-sheet' },
    { page: 2, width: 366, height: 186, artwork: 'sbi-aof-page-2-peek', sheetClass: 'rounded-[2px] bg-white opacity-85 shadow-peek', peek: true },
  ],
  fields: [
    // Highlighted (applicable) fields
    { id: 'account-type', page: 1, x: 16, y: 110.88, width: 221.333, height: 38.99, applicable: true, required: true, label: '1. Account Type' },
    { id: 'photo', page: 1, x: 241.333, y: 110.88, width: 108.667, height: 106, applicable: true, required: true, label: 'Affix recent photo' },
    { id: 'full-name', page: 1, x: 16, y: 220.88, width: 334, height: 64.99, applicable: true, required: true, label: '2. Applicant Full Name' },
    { id: 'date-of-birth', page: 1, x: 16, y: 289.5, width: 136.833, height: 45.5, applicable: true, required: true, label: '3. Date of Birth' },
    { id: 'mobile', page: 1, x: 156.833, y: 289.5, width: 193.167, height: 46.5, applicable: true, required: true, label: '4. Mobile (+91)' },
    { id: 'address', page: 1, x: 16, y: 391.75, width: 334, height: 63.135, applicable: true, required: true, label: '5. Current Residential Address' },
    // Not applicable for this purpose (left untouched)
    { id: 'staff-senior', page: 1, x: 16, y: 153.86, width: 221.333, height: 43.375, applicable: false, required: false, label: 'Staff account ID / Senior citizen cert. no.' },
    { id: 'minor-guardian', page: 1, x: 16, y: 339.63, width: 334, height: 48.74, applicable: false, required: false, label: 'For minor account only' },
    { id: 'branch-use', page: 1, x: 16, y: 457.88, width: 334, height: 46, applicable: false, required: false, label: 'For branch office use only' },
  ],
};
