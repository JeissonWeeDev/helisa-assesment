import {
  Account,
  getAccountLevel,
  getParentAccountCode,
  normalizeAccountCode,
  type AccountNature,
} from '../../domain/entities/account.entity.js';
import {
  AccountNatureMismatchError,
  DuplicateAccountCodeError,
  MissingAccountNatureError,
  ParentAccountNotFoundError,
} from '../../domain/errors/account.errors.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';

export interface CreateAccountInput {
  code: string | number;
  name: string;
  nature?: AccountNature;
}

export class CreateAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: CreateAccountInput): Promise<Account> {
    const code = normalizeAccountCode(input.code);
    const level = getAccountLevel(code);

    const existingAccount = await this.accountRepository.findByCode(code);
    if (existingAccount) {
      throw new DuplicateAccountCodeError(code);
    }

    let nature: AccountNature;
    let parent: Account | null = null;

    if (level === 'clase') {
      if (!input.nature) {
        throw new MissingAccountNatureError(code);
      }

      nature = input.nature;
    } else {
      const parentCode = getParentAccountCode(code) as string;
      parent = await this.accountRepository.findByCode(parentCode);

      if (!parent) {
        throw new ParentAccountNotFoundError(parentCode, code);
      }

      if (input.nature && input.nature !== parent.nature) {
        throw new AccountNatureMismatchError(code, input.nature, parent.nature);
      }

      nature = parent.nature;
    }

    const account = Account.create({ code, name: input.name, nature });
    await this.accountRepository.save(account);

    if (parent?.allowsMovements) {
      await this.accountRepository.save(parent.withAllowsMovements(false));
    }

    return account;
  }
}

if (import.meta.vitest) {
  const { beforeEach, describe, expect, it } = import.meta.vitest;

  describe('CreateAccountUseCase', () => {
    let repository: AccountRepository;
    let useCase: CreateAccountUseCase;

    beforeEach(async () => {
      const { InMemoryAccountRepository } =
        await import('../../infrastructure/repositories/in-memory-account.repository.js');
      repository = new InMemoryAccountRepository();
      useCase = new CreateAccountUseCase(repository);
    });

    it('creates a class account with its nature', async () => {
      const account = await useCase.execute({
        code: '1',
        name: 'Activo',
        nature: 'debito',
      });

      expect(account).toMatchObject({
        code: '1',
        level: 'clase',
        nature: 'debito',
        allowsMovements: true,
      });
    });

    it('requires a nature for class accounts', async () => {
      await expect(
        useCase.execute({ code: '1', name: 'Activo' }),
      ).rejects.toThrow(MissingAccountNatureError);
    });

    it('rejects duplicate codes', async () => {
      await useCase.execute({ code: '1', name: 'Activo', nature: 'debito' });

      await expect(
        useCase.execute({ code: '1', name: 'Activo', nature: 'debito' }),
      ).rejects.toThrow(DuplicateAccountCodeError);
    });

    it('requires the parent account to exist', async () => {
      await expect(
        useCase.execute({ code: '11', name: 'Disponible' }),
      ).rejects.toThrow(ParentAccountNotFoundError);
    });

    it('inherits the nature and disables parent movements', async () => {
      await useCase.execute({ code: '1', name: 'Activo', nature: 'debito' });

      const child = await useCase.execute({ code: '11', name: 'Disponible' });

      expect(child).toMatchObject({
        code: '11',
        level: 'grupo',
        nature: 'debito',
        allowsMovements: true,
      });
      expect((await repository.findByCode('1'))?.allowsMovements).toBe(false);
    });

    it('rejects a nature that does not match the parent', async () => {
      await useCase.execute({ code: '1', name: 'Activo', nature: 'debito' });

      await expect(
        useCase.execute({
          code: '11',
          name: 'Disponible',
          nature: 'credito',
        }),
      ).rejects.toThrow(AccountNatureMismatchError);
    });
  });
}
