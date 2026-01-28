import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateSplitDto, UpdateSplitDto } from './dto/split.dto';
import { Split, SplitStatus, SplitType } from './entities/split.entity';
import { SplitsService } from './splits.service';

// ============================================
// UNIT TESTS
// ============================================

const mockSplitRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('SplitsService', () => {
  let service: SplitsService;
  let repository: any;

  const mockSplit: Split = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    creatorId: 'wallet_abc123',
    title: 'Dinner at Luigis',
    currency: 'USD',
    totalAmount: 100.50,
    taxAmount: 10.00,
    tipAmount: 15.00,
    status: SplitStatus.ACTIVE,
    splitType: SplitType.EQUAL,
    receiptImageUrl: null,
    paymentDeadline: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SplitsService,
        {
          provide: getRepositoryToken(Split),
          useFactory: mockSplitRepository,
        },
      ],
    }).compile();

    service = module.get<SplitsService>(SplitsService);
    repository = module.get(getRepositoryToken(Split));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a split', async () => {
      const createDto: CreateSplitDto = {
        creatorId: 'wallet_abc123',
        title: 'Dinner at Luigis',
        currency: 'USD',
        totalAmount: 100.50,
      };

      repository.create.mockReturnValue(mockSplit);
      repository.save.mockResolvedValue(mockSplit);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSplit);
    });
  });

  describe('findAll', () => {
    it('should return an array of splits', async () => {
      repository.find.mockResolvedValue([mockSplit]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([mockSplit]);
    });
  });

  describe('findOne', () => {
    it('should return a split by id', async () => {
      repository.findOne.mockResolvedValue(mockSplit);

      const result = await service.findOne(mockSplit.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockSplit.id },
      });
      expect(result).toEqual(mockSplit);
    });

    it('should throw NotFoundException when split not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a split', async () => {
      const updateDto: UpdateSplitDto = { title: 'Updated Title' };
      const updatedSplit = { ...mockSplit, ...updateDto };

      repository.findOne.mockResolvedValue(mockSplit);
      repository.save.mockResolvedValue(updatedSplit);

      const result = await service.update(mockSplit.id, updateDto);

      expect(result.title).toEqual('Updated Title');
    });
  });

  describe('remove', () => {
    it('should remove a split', async () => {
      repository.findOne.mockResolvedValue(mockSplit);
      repository.remove.mockResolvedValue(mockSplit);

      await service.remove(mockSplit.id);

      expect(repository.remove).toHaveBeenCalledWith(mockSplit);
    });
  });

  describe('updateStatus', () => {
    it('should update split status', async () => {
      const newStatus = SplitStatus.COMPLETED;
      const updatedSplit = { ...mockSplit, status: newStatus };

      repository.findOne.mockResolvedValue(mockSplit);
      repository.save.mockResolvedValue(updatedSplit);

      const result = await service.updateStatus(mockSplit.id, newStatus);

      expect(result.status).toEqual(newStatus);
    });
  });
});