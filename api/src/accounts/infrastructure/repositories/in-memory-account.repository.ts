import {
  Account,
  getParentAccountCode,
} from '../../domain/entities/account.entity.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';

export class InMemoryAccountRepository implements AccountRepository {
  private readonly accounts = new Map<string, Account>();

  async findAll(): Promise<Account[]> {
    return [...this.accounts.values()];
  }

  async findByCode(code: string): Promise<Account | null> {
    return this.accounts.get(code) ?? null;
  }

  async save(account: Account): Promise<void> {
    this.accounts.set(account.code, account);
  }

  async hasChildren(code: string): Promise<boolean> {
    for (const account of this.accounts.values()) {
      if (getParentAccountCode(account.code) === code) {
        return true;
      }
    }

    return false;
  }

  async deleteByCode(code: string): Promise<void> {
    this.accounts.delete(code);
  }
}
