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
