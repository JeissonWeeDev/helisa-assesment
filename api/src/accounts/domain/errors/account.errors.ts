export class AccountDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidAccountCodeError extends AccountDomainError {
  constructor(code: string) {
    super(
      `El código de cuenta "${code}" no es válido: debe contener solo dígitos y tener longitud 1, 2, 4 o 6.`,
    );
  }
}

export class EmptyAccountNameError extends AccountDomainError {
  constructor() {
    super('El nombre de la cuenta es obligatorio.');
  }
}

export class InvalidAccountNatureError extends AccountDomainError {
  constructor(nature: unknown) {
    super(
      `La naturaleza "${String(nature)}" no es válida: debe ser "debito" o "credito".`,
    );
  }
}

export class MissingAccountNatureError extends AccountDomainError {
  constructor(code: string) {
    super(
      `La cuenta de nivel clase "${code}" requiere una naturaleza contable ("debito" o "credito").`,
    );
  }
}

export class DuplicateAccountCodeError extends AccountDomainError {
  constructor(code: string) {
    super(`Ya existe una cuenta con el código "${code}".`);
  }
}

export class ParentAccountNotFoundError extends AccountDomainError {
  constructor(parentCode: string, code: string) {
    super(
      `No existe la cuenta padre "${parentCode}" requerida por la cuenta "${code}".`,
    );
  }
}

export class AccountNotFoundError extends AccountDomainError {
  constructor(code: string) {
    super(`No se encontró la cuenta con el código "${code}".`);
  }
}

export class AccountHasChildrenError extends AccountDomainError {
  constructor(code: string) {
    super(
      `No se puede eliminar la cuenta "${code}" porque tiene cuentas hijas.`,
    );
  }
}

export class AccountNatureMismatchError extends AccountDomainError {
  constructor(code: string, nature: string, parentNature: string) {
    super(
      `La cuenta "${code}" debe heredar la naturaleza "${parentNature}" de su padre; se recibió "${nature}".`,
    );
  }
}
