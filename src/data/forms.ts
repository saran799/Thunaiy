import type { DirectoryForm, FormType, RecentForm } from '../types';

/** Form types shown on the "Select your form" screen. */
export const formTypes: FormType[] = [
  { id: 'account-opening', title: 'Account Opening Form', description: 'Open a new savings or current account', selectIcon: '3b03e' },
  { id: 'account-closure', title: 'Account Closure Form', description: 'Close an existing bank account', selectIcon: '66683' },
  { id: 'kyc-update', title: 'KYC Update Form', description: 'Update your customer information', selectIcon: '9fe10' },
  { id: 'address-change', title: 'Address Change Form', description: 'Update your registered address', selectIcon: '3d89d' },
  { id: 'minor-to-major', title: 'Minor to Major Conversion', description: 'Convert a minor account to a major account', selectIcon: 'e300b' },
  { id: 'nomination', title: 'Nomination Form', description: 'Add or update a nominee', selectIcon: '83a20' },
];

/** Entries listed on the Forms directory screen (one per bank in the Figma mock). */
export const directoryForms: DirectoryForm[] = [
  { id: 'sbi-account-opening', title: 'Account Opening Form', bankName: 'State Bank of India', description: 'Open a new savings or current account', icon: 'fe9da' },
  { id: 'hdfc-kyc-update', title: 'KYC Update Form', bankName: 'HDFC Bank', description: 'Update your customer information', icon: '29aee' },
  { id: 'icici-address-change', title: 'Address Change Form', bankName: 'ICICI Bank', description: 'Update your registered address', icon: 'b7ee3' },
  { id: 'bob-nomination', title: 'Nomination Form', bankName: 'Bank of Baroda', description: 'Add or update a nominee', icon: '7b1b0' },
  { id: 'canara-account-closure', title: 'Account Closure Form', bankName: 'Canara Bank', description: 'Close an existing bank account', icon: '543f1' },
];

export const directoryBankFilters = ['All', 'SBI', 'HDFC', 'ICICI', 'Bank of Baroda', 'Canara'];

export const recentForms: RecentForm[] = [
  { id: 'recent-sbi-account-opening', title: 'Account Opening Form', bankName: 'State Bank of India', status: 'completed', icon: '470de' },
  { id: 'recent-hdfc-kyc-update', title: 'KYC Update Form', bankName: 'HDFC Bank', status: 'viewed', icon: '48394' },
];
