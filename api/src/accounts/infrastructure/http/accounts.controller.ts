import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common';
import { CreateAccountUseCase } from '../../application/use-cases/create-account.use-case.js';
import { DeleteAccountUseCase } from '../../application/use-cases/delete-account.use-case.js';
import {
  GetAccountTreeUseCase,
  type AccountTreeNode,
} from '../../application/use-cases/get-account-tree.use-case.js';
import { AccountResponseDto } from './dto/account-response.dto.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { AccountDomainExceptionFilter } from './filters/account-domain-exception.filter.js';

@Controller('accounts')
@UseFilters(AccountDomainExceptionFilter)
export class AccountsController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly getAccountTreeUseCase: GetAccountTreeUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
  ) {}

  @Get('tree')
  getTree(): Promise<AccountTreeNode[]> {
    return this.getAccountTreeUseCase.execute();
  }

  @Post()
  async create(@Body() dto: CreateAccountDto): Promise<AccountResponseDto> {
    const account = await this.createAccountUseCase.execute(dto);

    return new AccountResponseDto(account);
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('code') code: string): Promise<void> {
    await this.deleteAccountUseCase.execute(code);
  }
}
