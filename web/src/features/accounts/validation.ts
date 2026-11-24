import type { AccountLevel } from './types'

export const ACCOUNT_CODE_LENGTHS = [1, 2, 4, 6] as const

export function isNumericCode(code: string): boolean {
  return /^\d+$/.test(code)
}

export function isAllowedCodeLength(length: number): boolean {
  return (ACCOUNT_CODE_LENGTHS as readonly number[]).includes(length)
}

export function resolveAccountLevel(code: string): AccountLevel | null {
  if (!isNumericCode(code)) {
    return null
  }

  switch (code.length) {
    case 1:
      return 'clase'
    case 2:
      return 'grupo'
    case 4:
      return 'cuenta'
    case 6:
      return 'subcuenta'
    default:
      return null
  }
}

export interface CreateAccountFormValues {
  code: string
  name: string
  nature: string
}

export interface CreateAccountValidationResult {
  values?: {
    code: string
    name: string
    nature?: 'debito' | 'credito'
  }
  errors: Partial<Record<'code' | 'name' | 'nature', string>>
}

export function validateCreateAccount(
  input: CreateAccountFormValues,
): CreateAccountValidationResult {
  const code = input.code.trim()
  const name = input.name.trim()
  const errors: CreateAccountValidationResult['errors'] = {}

  if (!code) {
    errors.code = 'El código es obligatorio.'
  } else if (!isNumericCode(code)) {
    errors.code = 'El código debe contener solo dígitos.'
  } else if (!isAllowedCodeLength(code.length)) {
    errors.code = 'El código debe tener longitud 1, 2, 4 o 6.'
  }

  if (!name) {
    errors.name = 'El nombre es obligatorio.'
  }

  const level = resolveAccountLevel(code)
  let nature: 'debito' | 'credito' | undefined

  if (level === 'clase') {
    if (input.nature === 'debito' || input.nature === 'credito') {
      nature = input.nature
    } else {
      errors.nature = 'Selecciona la naturaleza de la clase.'
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { errors, values: { code, name, nature } }
}
