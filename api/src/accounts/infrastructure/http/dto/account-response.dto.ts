import type {
  Account,
  AccountLevel,
  AccountNature,
} from '../../../domain/entities/account.entity.js';

export class AccountResponseDto {
  readonly code: string;
  readonly name: string;
  readonly level: AccountLevel;
  readonly nature: AccountNature;
  readonly allowsMovements: boolean;

  constructor(account: Account) {
    this.code = account.code;
    this.name = account.name;
    this.level = account.level;
    this.nature = account.nature;
    this.allowsMovements = account.allowsMovements;
  }
}
