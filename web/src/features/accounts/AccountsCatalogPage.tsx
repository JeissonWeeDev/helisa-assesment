import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { accountsApi, getErrorMessage } from './api'
import { AccountTree } from './components/AccountTree'
import { CreateAccountForm } from './components/CreateAccountForm'
import type { AccountTreeNode, CreateAccountInput } from './types'
import {
  collectCodesWithChildren,
  countTreeNodes,
  getAncestorCodes,
} from './tree-utils'
import './accounts.css'

type LoadMode = 'initial' | 'refresh'

export function AccountsCatalogPage() {
  const [tree, setTree] = useState<AccountTreeNode[]>([])
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(
    () => new Set(),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deletingCode, setDeletingCode] = useState<string | null>(null)
  const didInitialExpand = useRef(false)

  const applyTree = useCallback((data: AccountTreeNode[]) => {
    setTree(data)

    if (!didInitialExpand.current) {
      didInitialExpand.current = true
      setExpandedCodes(new Set(collectCodesWithChildren(data)))
    }
  }, [])

  const loadTree = useCallback(
    async (mode: LoadMode = 'refresh') => {
      if (mode === 'initial') {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      setLoadError(null)

      try {
        applyTree(await accountsApi.getTree())
      } catch (error) {
        setLoadError(getErrorMessage(error))
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [applyTree],
  )

  useEffect(() => {
    let cancelled = false

    async function loadInitialTree(): Promise<void> {
      try {
        const data = await accountsApi.getTree()

        if (!cancelled) {
          applyTree(data)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialTree()

    return () => {
      cancelled = true
    }
  }, [applyTree])

  const totalAccounts = useMemo(() => countTreeNodes(tree), [tree])

  const handleCreate = useCallback(
    async (input: CreateAccountInput) => {
      await accountsApi.create(input)

      setActionError(null)
      setSuccessMessage(`Cuenta ${input.code} creada correctamente.`)
      setExpandedCodes((previous) => {
        const next = new Set(previous)
        for (const ancestor of getAncestorCodes(input.code)) {
          next.add(ancestor)
        }
        return next
      })

      await loadTree('refresh')
    },
    [loadTree],
  )

  const handleDelete = useCallback(
    async (node: AccountTreeNode) => {
      const confirmed = window.confirm(
        `¿Eliminar la cuenta ${node.code} - ${node.name}?`,
      )

      if (!confirmed) {
        return
      }

      setDeletingCode(node.code)
      setActionError(null)
      setSuccessMessage(null)

      try {
        await accountsApi.remove(node.code)
        setSuccessMessage(`Cuenta ${node.code} eliminada correctamente.`)
        await loadTree('refresh')
      } catch (error) {
        setActionError(getErrorMessage(error))
      } finally {
        setDeletingCode(null)
      }
    },
    [loadTree],
  )

  const toggleNode = useCallback((code: string) => {
    setExpandedCodes((previous) => {
      const next = new Set(previous)

      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }

      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedCodes(new Set(collectCodesWithChildren(tree)))
  }, [tree])

  const collapseAll = useCallback(() => {
    setExpandedCodes(new Set())
  }, [])

  const hasAccounts = tree.length > 0

  return (
    <main className="accounts-page">
      <header className="accounts-header">
        <div>
          <p className="eyebrow">Catálogo contable</p>
          <h1>Plan de cuentas</h1>
          <p className="accounts-header__subtitle">
            Consulta la jerarquía, crea cuentas y elimina las que no tengan
            hijas.
          </p>
        </div>
        <div className="accounts-header__count" aria-live="polite">
          <strong>{totalAccounts}</strong>
          <span>{totalAccounts === 1 ? 'cuenta' : 'cuentas'}</span>
        </div>
      </header>

      {loadError && (
        <div className="alert alert--error" role="alert">
          <span>{loadError}</span>
          <button
            type="button"
            className="button button--small"
            onClick={() =>
              void loadTree(hasAccounts ? 'refresh' : 'initial')
            }
          >
            Reintentar
          </button>
        </div>
      )}

      {actionError && (
        <div className="alert alert--error" role="alert">
          <span>{actionError}</span>
          <button
            type="button"
            className="alert__close"
            onClick={() => setActionError(null)}
            aria-label="Cerrar mensaje de error"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert--success" role="status">
          <span>{successMessage}</span>
          <button
            type="button"
            className="alert__close"
            onClick={() => setSuccessMessage(null)}
            aria-label="Cerrar mensaje de éxito"
          >
            ×
          </button>
        </div>
      )}

      <div className="accounts-layout">
        <section
          className="panel"
          aria-labelledby="accounts-tree-title"
          aria-busy={isLoading || isRefreshing}
        >
          <div className="panel__header">
            <h2 id="accounts-tree-title">Cuentas</h2>
            <div className="toolbar">
              <button
                type="button"
                className="button button--small"
                onClick={() => void loadTree('refresh')}
                disabled={isLoading || isRefreshing}
              >
                {isRefreshing ? 'Actualizando…' : 'Actualizar'}
              </button>
              <button
                type="button"
                className="button button--small"
                onClick={expandAll}
                disabled={!hasAccounts}
              >
                Expandir todo
              </button>
              <button
                type="button"
                className="button button--small"
                onClick={collapseAll}
                disabled={!hasAccounts}
              >
                Colapsar todo
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state" role="status">
              <span className="spinner" aria-hidden="true" />
              <span>Cargando catálogo de cuentas…</span>
            </div>
          ) : loadError && !hasAccounts ? (
            <div className="empty-state empty-state--error">
              <p className="empty-state__title">No se pudo cargar el catálogo</p>
              <p>{loadError}</p>
              <button
                type="button"
                className="button button--primary"
                onClick={() => void loadTree('initial')}
              >
                Reintentar
              </button>
            </div>
          ) : (
            <AccountTree
              nodes={tree}
              expandedCodes={expandedCodes}
              deletingCode={deletingCode}
              onToggle={toggleNode}
              onDelete={handleDelete}
            />
          )}

          {isRefreshing && hasAccounts && (
            <p className="refresh-hint" role="status">
              Actualizando catálogo…
            </p>
          )}
        </section>

        <aside className="panel panel--form" aria-labelledby="new-account">
          <CreateAccountForm onCreate={handleCreate} />
        </aside>
      </div>
    </main>
  )
}
