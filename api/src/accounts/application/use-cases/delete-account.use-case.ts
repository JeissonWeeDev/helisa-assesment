import {
  getParentAccountCode,
  normalizeAccountCode,
} from '../../domain/entities/account.entity.js';
import {
  AccountHasChildrenError,
  AccountNotFoundError,
} from '../../domain/errors/account.errors.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import type { CreateAccountUseCase } from './create-account.use-case.js';

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

if (import.meta.vitest) {
  const { beforeEach, describe, expect, it } = import.meta.vitest;

  describe('DeleteAccountUseCase', () => {
    let repository: AccountRepository;
    let createAccount: CreateAccountUseCase;
    let deleteAccount: DeleteAccountUseCase;

    beforeEach(async () => {
      const { InMemoryAccountRepository } =
        await import('../../infrastructure/repositories/in-memory-account.repository.js');
      const { CreateAccountUseCase } =
        await import('./create-account.use-case.js');

      repository = new InMemoryAccountRepository();
      createAccount = new CreateAccountUseCase(repository);
      deleteAccount = new DeleteAccountUseCase(repository);
    });

    it('does not delete an account with children', async () => {
      await createAccount.execute({
        code: '1',
        name: 'Activo',
        nature: 'debito',
      });
      await createAccount.execute({ code: '11', name: 'Disponible' });

      await expect(deleteAccount.execute('1')).rejects.toThrow(
        AccountHasChildrenError,
      );
    });

    it('deletes a leaf and restores the parent movements flag', async () => {
      await createAccount.execute({
        code: '1',
        name: 'Activo',
        nature: 'debito',
      });
      await createAccount.execute({ code: '11', name: 'Disponible' });

      await deleteAccount.execute('11');

      expect(await repository.findByCode('11')).toBeNull();
      expect((await repository.findByCode('1'))?.allowsMovements).toBe(true);
    });

    it('rejects deleting a missing account', async () => {
      await expect(deleteAccount.execute('9999')).rejects.toThrow(
        AccountNotFoundError,
      );
    });
  });
}
