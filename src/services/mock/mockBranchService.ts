import type { Branch } from '../../domain/types';
import type { BranchService } from '../types';

export const MOCK_BRANCHES: Branch[] = [
  { id: 'sbi-koramangala', name: 'SBI Koramangala', bankId: 'sbi', isActive: true },
  { id: 'hdfc-indiranagar', name: 'HDFC Indiranagar', bankId: 'hdfc', isActive: true },
];

export class MockBranchService implements BranchService {
  async getBranch(branchId: string): Promise<Branch | null> {
    return MOCK_BRANCHES.find((b) => b.id === branchId) ?? null;
  }
}
