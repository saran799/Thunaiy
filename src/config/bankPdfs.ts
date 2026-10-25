export interface BankPdfDefinition {
  bankId: string;
  formTypeId: string;
  bankFormId: string;
  filename: string;
  publicUrl: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
}

/**
 * Verified bank form PDF files located in public/bank/
 */
export const BANK_PDFS: BankPdfDefinition[] = [
  {
    bankId: 'sbi',
    formTypeId: 'account-opening',
    bankFormId: 'sbi::account-opening',
    filename: '121120-Account Opening Form for Individuals.pdf',
    publicUrl: '/bank/sbi/121120-Account%20Opening%20Form%20for%20Individuals.pdf',
    titleKey: 'form.accountOpening.title',
    descriptionKey: 'form.sbiAof.description',
    icon: '3b03e',
  },
  {
    bankId: 'hdfc',
    formTypeId: 'account-opening',
    bankFormId: 'hdfc::account-opening',
    filename: 'Account Opening Form - For Individuals ( for opening Regular Savings Account, Basic Savings Bank Deposit Account, Individual Current Account).pdf',
    publicUrl: '/bank/hdfc/Account%20Opening%20Form%20-%20For%20Individuals%20(%20for%20opening%20Regular%20Savings%20Account,%20Basic%20Savings%20Bank%20Deposit%20Account,%20Individual%20Current%20Account).pdf',
    titleKey: 'form.accountOpening.title',
    descriptionKey: 'form.hdfcAof.description',
    icon: '3b03e',
  },
  {
    bankId: 'hdfc',
    formTypeId: 'deposit-form',
    bankFormId: 'hdfc::deposit-form',
    filename: 'deposit-form.pdf',
    publicUrl: '/bank/hdfc/deposit-form.pdf',
    titleKey: 'form.depositForm.title',
    descriptionKey: 'form.depositForm.description',
    icon: '9fe10',
  },
  {
    bankId: 'bob',
    formTypeId: 'account-opening',
    bankFormId: 'bob::account-opening',
    filename: 'Account-Opening-Form-for-Individuals-05-11.pdf',
    publicUrl: '/bank/bob/Account-Opening-Form-for-Individuals-05-11.pdf',
    titleKey: 'form.accountOpening.title',
    descriptionKey: 'form.bobAof.description',
    icon: '3b03e',
  },
  {
    bankId: 'bob',
    formTypeId: 'fixed-deposit',
    bankFormId: 'bob::fixed-deposit',
    filename: 'Bank-of-Baroda-FDR-term-fixed-deposit-english.pdf',
    publicUrl: '/bank/bob/Bank-of-Baroda-FDR-term-fixed-deposit-english.pdf',
    titleKey: 'form.fixedDeposit.title',
    descriptionKey: 'form.fixedDeposit.description',
    icon: '83a20',
  },
];

export function getBankPdf(bankFormId: string): BankPdfDefinition | undefined {
  return BANK_PDFS.find((item) => item.bankFormId === bankFormId);
}

export function getBankPdfsForBank(bankId: string): BankPdfDefinition[] {
  return BANK_PDFS.filter((item) => item.bankId === bankId);
}

export function getAllBankPdfs(): BankPdfDefinition[] {
  return BANK_PDFS;
}
