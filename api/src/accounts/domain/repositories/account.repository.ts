import type { Account } from '../entities/account.entity.js';

export interface AccountRepository {
  findAll(): Promise<Account[]>;
  findByCode(code: string): Promise<Account | null>;
  save(account: Account): Promise<void>;
  hasChildren(code: string): Promise<boolean>;
  deleteByCode(code: string): Promise<void>;
}
