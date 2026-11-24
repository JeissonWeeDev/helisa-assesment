import type { AccountTreeNode } from '../types'
import { AccountTreeNodeItem } from './AccountTreeNodeItem'

interface AccountTreeProps {
  nodes: AccountTreeNode[]
  expandedCodes: ReadonlySet<string>
  deletingCode: string | null
  onToggle: (code: string) => void
  onDelete: (node: AccountTreeNode) => void
}

export function AccountTree({
  nodes,
  expandedCodes,
  deletingCode,
  onToggle,
  onDelete,
}: AccountTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state__title">Todavía no hay cuentas</p>
        <p>Crea la primera cuenta con el formulario de la derecha.</p>
      </div>
    )
  }

  return (
    <ul className="account-tree" role="tree" aria-label="Catálogo de cuentas">
      {nodes.map((node) => (
        <AccountTreeNodeItem
          key={node.code}
          node={node}
          depth={0}
          expandedCodes={expandedCodes}
          deletingCode={deletingCode}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
