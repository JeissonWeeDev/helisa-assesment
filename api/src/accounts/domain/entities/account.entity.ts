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

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest;

  describe('Account', () => {
    it('derives the level from the code length', () => {
      expect(getAccountLevel('1')).toBe('clase');
      expect(getAccountLevel('11')).toBe('grupo');
      expect(getAccountLevel('1105')).toBe('cuenta');
      expect(getAccountLevel('110505')).toBe('subcuenta');
    });

    it('derives the parent code from the previous level', () => {
      expect(getParentAccountCode('1')).toBeNull();
      expect(getParentAccountCode('11')).toBe('1');
      expect(getParentAccountCode('1105')).toBe('11');
      expect(getParentAccountCode('110505')).toBe('1105');
    });

    it('rejects codes that are not digits or have an invalid length', () => {
      expect(() => getAccountLevel('123')).toThrow(InvalidAccountCodeError);
      expect(() => getAccountLevel('AB')).toThrow(InvalidAccountCodeError);
      expect(() => getAccountLevel('-1')).toThrow(InvalidAccountCodeError);
    });

    it('creates a valid account and normalizes its data', () => {
      const account = Account.create({
        code: 1105,
        name: ' Caja ',
        nature: 'debito',
      });

      expect(account).toMatchObject({
        code: '1105',
        name: 'Caja',
        level: 'cuenta',
        nature: 'debito',
        allowsMovements: true,
      });
    });

    it('rejects an empty name and an invalid nature', () => {
      expect(() =>
        Account.create({ code: '1', name: '  ', nature: 'debito' }),
      ).toThrow(EmptyAccountNameError);

      expect(() =>
        Account.create({
          code: '11',
          name: 'Cuenta',
          nature: 'otra' as unknown as AccountNature,
        }),
      ).toThrow(InvalidAccountNatureError);
    });

    it('returns a copy with a different movements flag', () => {
      const account = Account.create({
        code: '1',
        name: 'Activo',
        nature: 'debito',
      });

      expect(account.withAllowsMovements(false).allowsMovements).toBe(false);
      expect(account.allowsMovements).toBe(true);
    });
  });
}
