import type { AccountLevel, AccountNature } from './types'

export const ACCOUNT_LEVEL_LABELS: Record<AccountLevel, string> = {
  clase: 'Clase',
  grupo: 'Grupo',
  cuenta: 'Cuenta',
  subcuenta: 'Subcuenta',
}

export const ACCOUNT_NATURE_LABELS: Record<AccountNature, string> = {
  debito: 'Débito',
  credito: 'Crédito',
}
