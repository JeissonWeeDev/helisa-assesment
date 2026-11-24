import type { AccountNature } from '../../../domain/entities/account.entity.js';

export class CreateAccountDto {
  code: string | number;
  name: string;
  nature?: AccountNature;
}
