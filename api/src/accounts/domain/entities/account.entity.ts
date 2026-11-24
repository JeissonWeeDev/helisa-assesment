import {
  EmptyAccountNameError,
  InvalidAccountCodeError,
  InvalidAccountNatureError,
} from '../errors/account.errors.js';

export type AccountLevel = 'clase' | 'grupo' | 'cuenta' | 'subcuenta';
export type AccountNature = 'debito' | 'credito';

const ACCOUNT_LEVEL_BY_CODE_LENGTH: Record<number, AccountLevel> = {
  1: 'clase',
  2: 'grupo',
  4: 'cuenta',
  6: 'subcuenta',
};

const PARENT_CODE_LENGTH_BY_CODE_LENGTH: Record<number, number> = {
  1: 0,
  2: 1,
  4: 2,
  6: 4,
};

export interface AccountProps {
  code: string | number;
  name: string;
  nature: AccountNature;
  allowsMovements?: boolean;
}

export class Account {
  private constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly level: AccountLevel,
    public readonly nature: AccountNature,
    private readonly _allowsMovements: boolean,
  ) {}

  get allowsMovements(): boolean {
    return this._allowsMovements;
  }

  static create(props: AccountProps): Account {
    const code = normalizeAccountCode(props.code);
    const level = getAccountLevel(code);
    const name = props.name?.trim();

    if (!name) {
      throw new EmptyAccountNameError();
    }

    if (!isAccountNature(props.nature)) {
      throw new InvalidAccountNatureError(props.nature);
    }

    return new Account(
      code,
      name,
      level,
      props.nature,
      props.allowsMovements ?? true,
    );
  }

  withAllowsMovements(allowsMovements: boolean): Account {
    return new Account(
      this.code,
      this.name,
      this.level,
      this.nature,
      allowsMovements,
    );
  }
}

export function normalizeAccountCode(code: string | number): string {
  return String(code).trim();
}

export function isValidAccountCode(code: string): boolean {
  return (
    /^\d+$/.test(code) &&
    ACCOUNT_LEVEL_BY_CODE_LENGTH[code.length] !== undefined
  );
}

export function getAccountLevel(code: string): AccountLevel {
  if (!isValidAccountCode(code)) {
    throw new InvalidAccountCodeError(code);
  }

  return ACCOUNT_LEVEL_BY_CODE_LENGTH[code.length];
}

export function getParentAccountCode(code: string): string | null {
  getAccountLevel(code);

  const parentCodeLength = PARENT_CODE_LENGTH_BY_CODE_LENGTH[code.length];

  return parentCodeLength === 0 ? null : code.slice(0, parentCodeLength);
}

export function isAccountNature(value: unknown): value is AccountNature {
  return value === 'debito' || value === 'credito';
}
