export type AccountLevel = 'clase' | 'grupo' | 'cuenta' | 'subcuenta'
export type AccountNature = 'debito' | 'credito'

export interface Account {
  code: string
  name: string
  level: AccountLevel
  nature: AccountNature
  allowsMovements: boolean
}

export interface AccountTreeNode extends Account {
  children: AccountTreeNode[]
}

export interface CreateAccountInput {
  code: string
  name: string
  nature?: AccountNature
}

export interface ApiErrorBody {
  message?: string
  field?: string
}
