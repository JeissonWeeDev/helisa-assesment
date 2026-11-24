import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  AccountDomainError,
  AccountHasChildrenError,
  AccountNatureMismatchError,
  AccountNotFoundError,
  DuplicateAccountCodeError,
  EmptyAccountNameError,
  InvalidAccountCodeError,
  InvalidAccountNatureError,
  MissingAccountNatureError,
  ParentAccountNotFoundError,
} from '../../../domain/errors/account.errors.js';

interface HttpErrorMapping {
  status: number;
  field?: string;
}

@Catch(AccountDomainError)
export class AccountDomainExceptionFilter implements ExceptionFilter {
  catch(exception: AccountDomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const mapping = resolveHttpError(exception);

    response.status(mapping.status).json({
      message: exception.message,
      ...(mapping.field ? { field: mapping.field } : {}),
    });
  }
}

function resolveHttpError(exception: AccountDomainError): HttpErrorMapping {
  if (exception instanceof DuplicateAccountCodeError) {
    return { status: HttpStatus.CONFLICT, field: 'code' };
  }

  if (exception instanceof AccountNotFoundError) {
    return { status: HttpStatus.NOT_FOUND, field: 'code' };
  }

  if (
    exception instanceof InvalidAccountCodeError ||
    exception instanceof ParentAccountNotFoundError
  ) {
    return { status: HttpStatus.BAD_REQUEST, field: 'code' };
  }

  if (exception instanceof EmptyAccountNameError) {
    return { status: HttpStatus.BAD_REQUEST, field: 'name' };
  }

  if (
    exception instanceof InvalidAccountNatureError ||
    exception instanceof MissingAccountNatureError ||
    exception instanceof AccountNatureMismatchError
  ) {
    return { status: HttpStatus.BAD_REQUEST, field: 'nature' };
  }

  if (exception instanceof AccountHasChildrenError) {
    return { status: HttpStatus.BAD_REQUEST };
  }

  return { status: HttpStatus.BAD_REQUEST };
}
