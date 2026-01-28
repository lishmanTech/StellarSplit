// ============================================
// SPLITS MODULE
// ============================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SplitsController } from './split.controller';
import { Split } from './entities/split.entity';
import { SplitsService } from './splits.service';

@Module({
  imports: [TypeOrmModule.forFeature([Split])],
  controllers: [SplitsController],
  providers: [SplitsService],
  exports: [SplitsService],
})
export class SplitsModule {}
