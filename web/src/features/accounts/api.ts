import { apiUrl } from '../../api'
import type {
  Account,
  AccountTreeNode,
  ApiErrorBody,
  CreateAccountInput,
} from './types'

export class ApiError extends Error {
  readonly status: number
  readonly field?: string

  constructor(message: string, status: number, field?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.field = field
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(apiUrl(path), init)
  } catch {
    throw new ApiError(
      'No se pudo conectar con la API. Verifica que el servidor esté corriendo.',
      0,
    )
  }

  if (!response.ok) {
    let body: ApiErrorBody = {}

    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      body = {}
    }

    const message =
      typeof body.message === 'string' && body.message.trim() !== ''
        ? body.message
        : `La API respondió con el estado ${response.status}.`

    throw new ApiError(
      message,
      response.status,
      typeof body.field === 'string' ? body.field : undefined,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const accountsApi = {
  getTree(): Promise<AccountTreeNode[]> {
    return request<AccountTreeNode[]>('/accounts/tree')
  },

  create(input: CreateAccountInput): Promise<Account> {
    return request<Account>('/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  remove(code: string): Promise<void> {
    return request<void>(`/accounts/${encodeURIComponent(code)}`, {
      method: 'DELETE',
    })
  },
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
