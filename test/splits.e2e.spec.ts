import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/app.module';
import request from "supertest";

describe('SplitsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/splits (POST)', () => {
    return request(app.getHttpServer())
      .post('/splits')
      .send({
        creatorId: 'wallet_test123',
        title: 'Test Dinner',
        currency: 'USD',
        totalAmount: 150.00,
        taxAmount: 12.50,
        tipAmount: 22.50,
      })
      .expect(201)
      .expect((res:any) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toEqual('Test Dinner');
      });
  });

  it('/splits (GET)', () => {
    return request(app.getHttpServer())
      .get('/splits')
      .expect(200)
      .expect((res:any) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});