import { useState, type FormEvent } from 'react'
import { ApiError, getErrorMessage } from '../api'
import {
  ACCOUNT_LEVEL_LABELS,
  ACCOUNT_NATURE_LABELS,
} from '../constants'
import type { CreateAccountInput } from '../types'
import {
  resolveAccountLevel,
  validateCreateAccount,
  type CreateAccountFormValues,
} from '../validation'

interface CreateAccountFormProps {
  onCreate: (input: CreateAccountInput) => Promise<void>
}

type FormField = keyof CreateAccountFormValues
type FieldErrors = Partial<Record<FormField, string>>

const INITIAL_VALUES: CreateAccountFormValues = {
  code: '',
  name: '',
  nature: '',
}

function isFormField(value: string): value is FormField {
  return value === 'code' || value === 'name' || value === 'nature'
}

export function CreateAccountForm({ onCreate }: CreateAccountFormProps) {
  const [values, setValues] = useState<CreateAccountFormValues>(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const level = resolveAccountLevel(values.code.trim())
  const showNature = level === 'clase'

  function updateField(field: FormField, value: string): void {
    setValues((previous) => ({ ...previous, [field]: value }))
    setFieldErrors((previous) => {
      if (!(field in previous)) {
        return previous
      }

      const next = { ...previous }
      delete next[field]
      return next
    })
    setGeneralError(null)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    const validation = validateCreateAccount(values)

    if (!validation.values) {
      setFieldErrors(validation.errors)
      setGeneralError(null)
      return
    }

    setFieldErrors({})
    setGeneralError(null)
    setIsSubmitting(true)

    try {
      await onCreate(validation.values)
      setValues(INITIAL_VALUES)
    } catch (error) {
      if (error instanceof ApiError && error.field && isFormField(error.field)) {
        setFieldErrors({ [error.field]: error.message })
      } else {
        setGeneralError(getErrorMessage(error))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="account-form" onSubmit={handleSubmit} noValidate>
      <div className="account-form__header">
        <h2 id="new-account">Nueva cuenta</h2>
        <p>
          Los códigos usan longitudes 1, 2, 4 o 6 y determinan el nivel de la
          cuenta.
        </p>
      </div>

      {generalError && (
        <div className="alert alert--error" role="alert">
          <span>{generalError}</span>
        </div>
      )}

      <div className={`field ${fieldErrors.code ? 'field--invalid' : ''}`}>
        <label htmlFor="account-code">
          Código <span aria-hidden="true">*</span>
        </label>
        <input
          id="account-code"
          name="code"
          value={values.code}
          onChange={(event) => updateField('code', event.target.value)}
          placeholder="Ej. 110505"
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={Boolean(fieldErrors.code)}
          aria-describedby={fieldErrors.code ? 'account-code-error' : undefined}
        />
        {level && (
          <p className="field-hint">
            Nivel detectado: <strong>{ACCOUNT_LEVEL_LABELS[level]}</strong>
          </p>
        )}
        {fieldErrors.code && (
          <p className="field-error" id="account-code-error" role="alert">
            {fieldErrors.code}
          </p>
        )}
      </div>

      <div className={`field ${fieldErrors.name ? 'field--invalid' : ''}`}>
        <label htmlFor="account-name">
          Nombre <span aria-hidden="true">*</span>
        </label>
        <input
          id="account-name"
          name="name"
          value={values.name}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder="Ej. Caja general"
          autoComplete="off"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? 'account-name-error' : undefined}
        />
        {fieldErrors.name && (
          <p className="field-error" id="account-name-error" role="alert">
            {fieldErrors.name}
          </p>
        )}
      </div>

      {showNature && (
        <div
          className={`field ${fieldErrors.nature ? 'field--invalid' : ''}`}
        >
          <label htmlFor="account-nature">
            Naturaleza <span aria-hidden="true">*</span>
          </label>
          <select
            id="account-nature"
            name="nature"
            value={values.nature}
            onChange={(event) => updateField('nature', event.target.value)}
            aria-invalid={Boolean(fieldErrors.nature)}
            aria-describedby={
              fieldErrors.nature ? 'account-nature-error' : undefined
            }
          >
            <option value="">Selecciona una naturaleza</option>
            <option value="debito">{ACCOUNT_NATURE_LABELS.debito}</option>
            <option value="credito">{ACCOUNT_NATURE_LABELS.credito}</option>
          </select>
          {fieldErrors.nature && (
            <p className="field-error" id="account-nature-error" role="alert">
              {fieldErrors.nature}
            </p>
          )}
        </div>
      )}

      {level && level !== 'clase' && (
        <p className="field-hint field-hint--boxed">
          La naturaleza de esta cuenta se hereda automáticamente de su cuenta
          padre.
        </p>
      )}

      <button
        type="submit"
        className="button button--primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creando…' : 'Crear cuenta'}
      </button>
    </form>
  )
}
