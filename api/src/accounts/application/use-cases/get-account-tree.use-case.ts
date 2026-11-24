import {
  getParentAccountCode,
  type AccountLevel,
  type AccountNature,
} from '../../domain/entities/account.entity.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import type { CreateAccountUseCase } from './create-account.use-case.js';

export interface AccountTreeNode {
  code: string;
  name: string;
  level: AccountLevel;
  nature: AccountNature;
  allowsMovements: boolean;
  children: AccountTreeNode[];
}

export class GetAccountTreeUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(): Promise<AccountTreeNode[]> {
    const accounts = await this.accountRepository.findAll();
    const nodesByCode = new Map<string, AccountTreeNode>();

    for (const account of accounts) {
      nodesByCode.set(account.code, {
        code: account.code,
        name: account.name,
        level: account.level,
        nature: account.nature,
        allowsMovements: account.allowsMovements,
        children: [],
      });
    }

    const roots: AccountTreeNode[] = [];

    for (const account of accounts) {
      const node = nodesByCode.get(account.code) as AccountTreeNode;
      const parentCode = getParentAccountCode(account.code);
      const parentNode = parentCode ? nodesByCode.get(parentCode) : undefined;

      if (parentNode) {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }

    sortTree(roots);

    return roots;
  }
}

function sortTree(nodes: AccountTreeNode[]): void {
  nodes.sort((left, right) => left.code.localeCompare(right.code));

  for (const node of nodes) {
    sortTree(node.children);
  }
}

if (import.meta.vitest) {
  const { beforeEach, describe, expect, it } = import.meta.vitest;

  describe('GetAccountTreeUseCase', () => {
    let repository: AccountRepository;
    let createAccount: CreateAccountUseCase;
    let getAccountTree: GetAccountTreeUseCase;

    beforeEach(async () => {
      const { InMemoryAccountRepository } =
        await import('../../infrastructure/repositories/in-memory-account.repository.js');
      const { CreateAccountUseCase } =
        await import('./create-account.use-case.js');

      repository = new InMemoryAccountRepository();
      createAccount = new CreateAccountUseCase(repository);
      getAccountTree = new GetAccountTreeUseCase(repository);
    });

    it('returns accounts as a sorted nested tree', async () => {
      await createAccount.execute({
        code: '2',
        name: 'Pasivo',
        nature: 'credito',
      });
      await createAccount.execute({
        code: '1',
        name: 'Activo',
        nature: 'debito',
      });
      await createAccount.execute({ code: '11', name: 'Disponible' });
      await createAccount.execute({ code: '1105', name: 'Caja' });
      await createAccount.execute({ code: '110505', name: 'Caja general' });

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

    it('returns an empty tree when there are no accounts', async () => {
      await expect(getAccountTree.execute()).resolves.toEqual([]);
    });
  });
}
