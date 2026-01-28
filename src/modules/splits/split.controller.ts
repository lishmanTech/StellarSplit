import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateSplitDto, UpdateSplitDto } from './dto/split.dto';
import { SplitStatus } from './entities/split.entity';
import { SplitsService } from './splits.service';

@Controller('splits')
export class SplitsController {
  constructor(private readonly splitsService: SplitsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSplitDto: CreateSplitDto) {
    return await this.splitsService.create(createSplitDto);
  }

  @Get()
  async findAll(@Query('creatorId') creatorId?: string) {
    if (creatorId) {
      return await this.splitsService.findByCreator(creatorId);
    }
    return await this.splitsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.splitsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSplitDto: UpdateSplitDto,
  ) {
    return await this.splitsService.update(id, updateSplitDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: SplitStatus,
  ) {
    return await this.splitsService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.splitsService.remove(id);
  }
}