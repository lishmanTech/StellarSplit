import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Split, SplitStatus } from './entities/split.entity';
import { CreateSplitDto, UpdateSplitDto } from './dto/split.dto';

// ============================================
// SPLITS SERVICE
// ============================================

@Injectable()
export class SplitsService {
  constructor(
    @InjectRepository(Split)
    private readonly splitRepository: Repository<Split>,
  ) {}

  async create(createSplitDto: CreateSplitDto): Promise<Split> {
    const split = this.splitRepository.create(createSplitDto);
    return await this.splitRepository.save(split);
  }

  async findAll(): Promise<Split[]> {
    return await this.splitRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Split> {
    const split = await this.splitRepository.findOne({ where: { id } });
    if (!split) {
      throw new NotFoundException(`Split with ID "${id}" not found`);
    }
    return split;
  }

  async findByCreator(creatorId: string): Promise<Split[]> {
    return await this.splitRepository.find({
      where: { creatorId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateSplitDto: UpdateSplitDto): Promise<Split> {
    const split = await this.findOne(id);
    Object.assign(split, updateSplitDto);
    return await this.splitRepository.save(split);
  }

  async remove(id: string): Promise<void> {
    const split = await this.findOne(id);
    await this.splitRepository.remove(split);
  }

  async updateStatus(id: string, status: SplitStatus): Promise<Split> {
    const split = await this.findOne(id);
    split.status = status;
    return await this.splitRepository.save(split);
  }
}
