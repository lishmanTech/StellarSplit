import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';
import { BadRequestException } from '@nestjs/common';

describe('UploadService', () => {
  let service: UploadService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                AWS_REGION: 'us-east-1',
                AWS_ACCESS_KEY_ID: 'test-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret',
                S3_BUCKET_NAME: 'test-bucket',
                S3_ENDPOINT: 'http://localhost:4566',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPresignedUploadUrl', () => {
    it('should validate allowed mime types', async () => {
      await expect(
        service.getPresignedUploadUrl('test.jpg', 'image/invalid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate file size', async () => {
      const largeSize = 15 * 1024 * 1024; // 15MB
      await expect(
        service.getPresignedUploadUrl('test.jpg', 'image/jpeg', largeSize),
      ).rejects.toThrow(BadRequestException);
    });

    it('should sanitize filename', async () => {
      // Mock the S3 client to avoid actual calls
      const mockS3Client = {
        send: jest.fn(),
      };
      (service as any).s3Client = mockS3Client;

      // This would normally call getSignedUrl, but we'll mock it
      jest.mock('@aws-sdk/s3-request-presigner', () => ({
        getSignedUrl: jest.fn().mockResolvedValue('http://presigned-url'),
      }));

      const result = await service.getPresignedUploadUrl('test<script>.jpg', 'image/jpeg');
      expect(result.key).not.toContain('<script>');
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('should generate download URL', async () => {
      const key = 'receipts/test-key';
      // Mock getSignedUrl
      jest.mock('@aws-sdk/s3-request-presigner', () => ({
        getSignedUrl: jest.fn().mockResolvedValue('http://download-url'),
      }));

      const result = await service.getPresignedDownloadUrl(key);
      expect(result).toBe('http://download-url');
    });
  });
});