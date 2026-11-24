import { beforeEach, describe, expect, it } from 'vitest';
import { CreateAccountUseCase } from './application/use-cases/create-account.use-case.js';
import { DeleteAccountUseCase } from './application/use-cases/delete-account.use-case.js';
import { GetAccountTreeUseCase } from './application/use-cases/get-account-tree.use-case.js';
import {
  AccountHasChildrenError,
  AccountNatureMismatchError,
  AccountNotFoundError,
  DuplicateAccountCodeError,
  InvalidAccountCodeError,
  MissingAccountNatureError,
  ParentAccountNotFoundError,
} from './domain/errors/account.errors.js';
import { InMemoryAccountRepository } from './infrastructure/repositories/in-memory-account.repository.js';

describe('Accounts catalog', () => {
  let repository: InMemoryAccountRepository;
  let createAccount: CreateAccountUseCase;
  let getAccountTree: GetAccountTreeUseCase;
  let deleteAccount: DeleteAccountUseCase;

  beforeEach(() => {
    repository = new InMemoryAccountRepository();
    createAccount = new CreateAccountUseCase(repository);
    getAccountTree = new GetAccountTreeUseCase(repository);
    deleteAccount = new DeleteAccountUseCase(repository);
  });

  it('creates a class account with its nature', async () => {
    const account = await createAccount.execute({
      code: 1,
      name: 'Activo',
      nature: 'debito',
    });

    expect(account).toMatchObject({
      code: '1',
      name: 'Activo',
      level: 'clase',
      nature: 'debito',
      allowsMovements: true,
    });
  });

  it('rejects codes with invalid digits or lengths', async () => {
    await expect(
      createAccount.execute({ code: 'A1', name: 'Inválida', nature: 'debito' }),
    ).rejects.toThrow(InvalidAccountCodeError);

    await expect(
      createAccount.execute({
        code: '123',
        name: 'Inválida',
        nature: 'debito',
      }),
    ).rejects.toThrow(InvalidAccountCodeError);
  });

  it('requires a nature for class accounts', async () => {
    await expect(
      createAccount.execute({ code: '1', name: 'Activo' }),
    ).rejects.toThrow(MissingAccountNatureError);
  });

  it('rejects duplicate codes', async () => {
    await createAccount.execute({
      code: '1',
      name: 'Activo',
      nature: 'debito',
    });

    await expect(
      createAccount.execute({
        code: '1',
        name: 'Otro activo',
        nature: 'debito',
      }),
    ).rejects.toThrow(DuplicateAccountCodeError);
  });

  it('requires the parent account to exist', async () => {
    await expect(
      createAccount.execute({ code: '11', name: 'Disponible' }),
    ).rejects.toThrow(ParentAccountNotFoundError);
  });

  it('inherits the nature from the parent and disables parent movements', async () => {
    await createAccount.execute({
      code: '1',
      name: 'Activo',
      nature: 'debito',
    });

    const child = await createAccount.execute({
      code: '11',
      name: 'Disponible',
    });

    expect(child).toMatchObject({
      code: '11',
      level: 'grupo',
      nature: 'debito',
      allowsMovements: true,
    });

    const parent = await repository.findByCode('1');
    expect(parent?.allowsMovements).toBe(false);
  });

  it('rejects a nature that does not match the parent', async () => {
    await createAccount.execute({
      code: '1',
      name: 'Activo',
      nature: 'debito',
    });

    await expect(
      createAccount.execute({
        code: '11',
        name: 'Disponible',
        nature: 'credito',
      }),
    ).rejects.toThrow(AccountNatureMismatchError);
  });

  it('returns the accounts as a nested tree', async () => {
    await createAccount.execute({
      code: '1',
      name: 'Activo',
      nature: 'debito',
    });
    await createAccount.execute({ code: '11', name: 'Disponible' });
    await createAccount.execute({ code: '1105', name: 'Caja' });
    await createAccount.execute({ code: '110505', name: 'Caja general' });
    await createAccount.execute({
      code: '2',
      name: 'Pasivo',
      nature: 'credito',
    });

    const tree = await getAccountTree.execute();

    expect(tree.map((node) => node.code)).toEqual(['1', '2']);
    expect(tree[0].children.map((node) => node.code)).toEqual(['11']);
    expect(tree[0].children[0].children.map((node) => node.code)).toEqual([
      '1105',
    ]);
    expect(
      tree[0].children[0].children[0].children.map((node) => node.code),
    ).toEqual(['110505']);
    expect(tree[0].children[0].children[0].allowsMovements).toBe(false);
    expect(tree[0].children[0].children[0].children[0].allowsMovements).toBe(
      true,
    );
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

  it('fails to delete a missing account', async () => {
    await expect(deleteAccount.execute('9999')).rejects.toThrow(
      AccountNotFoundError,
    );
  });
});
