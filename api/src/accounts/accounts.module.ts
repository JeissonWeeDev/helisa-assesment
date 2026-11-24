import { Module, type INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import type supertest from 'supertest';
import { CreateAccountUseCase } from './application/use-cases/create-account.use-case.js';
import { DeleteAccountUseCase } from './application/use-cases/delete-account.use-case.js';
import { GetAccountTreeUseCase } from './application/use-cases/get-account-tree.use-case.js';
import type { AccountRepository } from './domain/repositories/account.repository.js';
import { AccountsController } from './infrastructure/http/accounts.controller.js';
import { InMemoryAccountRepository } from './infrastructure/repositories/in-memory-account.repository.js';

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');

@Module({
  controllers: [AccountsController],
  providers: [
    {
      provide: ACCOUNT_REPOSITORY,
      useFactory: () => new InMemoryAccountRepository(),
    },
    {
      provide: CreateAccountUseCase,
      useFactory: (accountRepository: AccountRepository) =>
        new CreateAccountUseCase(accountRepository),
      inject: [ACCOUNT_REPOSITORY],
    },
    {
      provide: GetAccountTreeUseCase,
      useFactory: (accountRepository: AccountRepository) =>
        new GetAccountTreeUseCase(accountRepository),
      inject: [ACCOUNT_REPOSITORY],
    },
    {
      provide: DeleteAccountUseCase,
      useFactory: (accountRepository: AccountRepository) =>
        new DeleteAccountUseCase(accountRepository),
      inject: [ACCOUNT_REPOSITORY],
    },
  ],
  exports: [
    ACCOUNT_REPOSITORY,
    CreateAccountUseCase,
    GetAccountTreeUseCase,
    DeleteAccountUseCase,
  ],
})
export class AccountsModule {}

if (import.meta.vitest) {
  const { afterEach, beforeEach, describe, expect, it } = import.meta.vitest;

  describe('Accounts HTTP API', () => {
    let app: INestApplication;
    let http: typeof supertest;

    beforeEach(async () => {
      const { Test } = await import('@nestjs/testing');
      const { default: request } = await import('supertest');
      http = request;

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [AccountsModule],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('POST /accounts creates an account', async () => {
      const response = await http(app.getHttpServer())
        .post('/accounts')
        .send({ code: '1', name: 'Activo', nature: 'debito' })
        .expect(201);

      expect(response.body).toEqual({
        code: '1',
        name: 'Activo',
        level: 'clase',
        nature: 'debito',
        allowsMovements: true,
      });
    });

    it('POST /accounts returns 409 for duplicate codes', async () => {
      await http(app.getHttpServer())
        .post('/accounts')
        .send({ code: '1', name: 'Activo', nature: 'debito' })
        .expect(201);

      const response = await http(app.getHttpServer())
        .post('/accounts')
        .send({ code: '1', name: 'Activo duplicado', nature: 'debito' })
        .expect(409);

      expect(response.body).toMatchObject({
        message: expect.stringContaining('Ya existe una cuenta'),
        field: 'code',
      });
    });

    it('POST /accounts returns 400 with the failing field', async () => {
      const invalidCode = await http(app.getHttpServer())
        .post('/accounts')
        .send({ code: '123', name: 'Inválida', nature: 'debito' })
        .expect(400);

      expect(invalidCode.body).toMatchObject({
        message: expect.stringContaining('no es válido'),
        field: 'code',
      });

      const missingNature = await http(app.getHttpServer())
        .post('/accounts')
        .send({ code: '1', name: 'Activo' })
        .expect(400);

      expect(missingNature.body).toMatchObject({
        message: expect.stringContaining('requiere una naturaleza'),
        field: 'nature',
      });
    });

    it('GET /accounts/tree returns the nested catalog', async () => {
      await http(app.getHttpServer())
        .post('/accounts')
        .send({ code: '1', name: 'Activo', nature: 'debito' })
        .expect(201);
      await http(app.getHttpServer())
        .post('/accounts')
        .send({ code: '11', name: 'Disponible' })
        .expect(201);
      await http(app.getHttpServer())
        .post('/accounts')
        .send({ code: '1105', name: 'Caja' })
        .expect(201);

      const response = await http(app.getHttpServer())
        .get('/accounts/tree')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].code).toBe('1');
      expect(response.body[0].children[0].code).toBe('11');
      expect(response.body[0].children[0].children[0].code).toBe('1105');
    });

    it('DELETE /accounts/:code rejects accounts with children', async () => {
      await http(app.getHttpServer())
        .post('/accounts')
        .send({ code: '1', name: 'Activo', nature: 'debito' })
        .expect(201);
      await http(app.getHttpServer())
        .post('/accounts')
        .send({ code: '11', name: 'Disponible' })
        .expect(201);

      const response = await http(app.getHttpServer())
        .delete('/accounts/1')
        .expect(400);

      expect(response.body).toMatchObject({
        message: expect.stringContaining('tiene cuentas hijas'),
      });
    });

    it('DELETE /accounts/:code returns 404 or 204', async () => {
      await http(app.getHttpServer())
        .post('/accounts')
        .send({ code: '1', name: 'Activo', nature: 'debito' })
        .expect(201);

      await http(app.getHttpServer()).delete('/accounts/9999').expect(404);
      await http(app.getHttpServer()).delete('/accounts/1').expect(204);
    });
  });
}
