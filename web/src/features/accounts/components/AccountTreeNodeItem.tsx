import {
  ACCOUNT_LEVEL_LABELS,
  ACCOUNT_NATURE_LABELS,
} from '../constants'
import type { AccountTreeNode } from '../types'

interface AccountTreeNodeItemProps {
  node: AccountTreeNode
  depth: number
  expandedCodes: ReadonlySet<string>
  deletingCode: string | null
  onToggle: (code: string) => void
  onDelete: (node: AccountTreeNode) => void
}

export function AccountTreeNodeItem({
  node,
  depth,
  expandedCodes,
  deletingCode,
  onToggle,
  onDelete,
}: AccountTreeNodeItemProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedCodes.has(node.code)
  const isDeleting = deletingCode === node.code

  return (
    <li
      className="account-tree__item"
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
    >
      <div
        className="account-row"
        style={{ paddingLeft: `${0.65 + depth * 1.35}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="tree-toggle"
            onClick={() => onToggle(node.code)}
            aria-label={`${isExpanded ? 'Colapsar' : 'Expandir'} ${node.code}`}
            aria-expanded={isExpanded}
          >
            {isExpanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="tree-toggle tree-toggle--empty" aria-hidden="true" />
        )}

        <span className="account-row__code">{node.code}</span>
        <span className="account-row__name">{node.name}</span>

        <span className="tag tag--level">
          {ACCOUNT_LEVEL_LABELS[node.level]}
        </span>
        <span className={`tag tag--nature tag--nature-${node.nature}`}>
          {ACCOUNT_NATURE_LABELS[node.nature]}
        </span>
        <span
          className={`tag ${
            node.allowsMovements ? 'tag--movements' : 'tag--group'
          }`}
        >
          {node.allowsMovements ? 'Admite movimientos' : 'Solo agrupación'}
        </span>

        <button
          type="button"
          className="button button--danger button--small account-row__delete"
          onClick={() => onDelete(node)}
          disabled={isDeleting}
          aria-label={`Eliminar la cuenta ${node.code}`}
        >
          {isDeleting ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul className="account-tree" role="group">
          {node.children.map((child) => (
            <AccountTreeNodeItem
              key={child.code}
              node={child}
              depth={depth + 1}
              expandedCodes={expandedCodes}
              deletingCode={deletingCode}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
