import type { AccountTreeNode } from './types'

export function collectCodesWithChildren(nodes: AccountTreeNode[]): string[] {
  const codes: string[] = []

  function visit(list: AccountTreeNode[]): void {
    for (const node of list) {
      if (node.children.length > 0) {
        codes.push(node.code)
        visit(node.children)
      }
    }
  }

  visit(nodes)

  return codes
}

export function countTreeNodes(nodes: AccountTreeNode[]): number {
  return nodes.reduce(
    (total, node) => total + 1 + countTreeNodes(node.children),
    0,
  )
}

export function getAncestorCodes(code: string): string[] {
  if (!/^\d+$/.test(code)) {
    return []
  }

  switch (code.length) {
    case 6:
      return [code.slice(0, 1), code.slice(0, 2), code.slice(0, 4)]
    case 4:
      return [code.slice(0, 1), code.slice(0, 2)]
    case 2:
      return [code.slice(0, 1)]
    default:
      return []
  }
}
