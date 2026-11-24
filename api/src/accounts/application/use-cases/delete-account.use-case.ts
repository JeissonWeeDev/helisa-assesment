import {
  getParentAccountCode,
  normalizeAccountCode,
} from '../../domain/entities/account.entity.js';
import {
  AccountHasChildrenError,
  AccountNotFoundError,
} from '../../domain/errors/account.errors.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';

export class DeleteAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(code: string | number): Promise<void> {
    const normalizedCode = normalizeAccountCode(code);
    const account = await this.accountRepository.findByCode(normalizedCode);

    if (!account) {
      throw new AccountNotFoundError(normalizedCode);
    }

    if (await this.accountRepository.hasChildren(normalizedCode)) {
      throw new AccountHasChildrenError(normalizedCode);
    }

    await this.accountRepository.deleteByCode(normalizedCode);

    const parentCode = getParentAccountCode(normalizedCode);

    if (!parentCode) {
      return;
    }

    const parent = await this.accountRepository.findByCode(parentCode);

    if (parent && !(await this.accountRepository.hasChildren(parentCode))) {
      await this.accountRepository.save(parent.withAllowsMovements(true));
    }
  }
}
