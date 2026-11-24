import {
  getParentAccountCode,
  type AccountLevel,
  type AccountNature,
} from '../../domain/entities/account.entity.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';

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
