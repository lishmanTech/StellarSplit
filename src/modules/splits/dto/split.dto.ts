import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUrl,
  IsDateString,
  Min,
  MaxLength,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SplitStatus, SplitType } from '../entities/split.entity';
import { PartialType } from '@nestjs/swagger/dist/type-helpers/partial-type.helper';

// ============================================
// CREATE SPLIT DTO
// ============================================
export class CreateSplitDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  creatorId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  currency: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  totalAmount: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  taxAmount?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  tipAmount?: number;

  @IsEnum(SplitStatus)
  @IsOptional()
  status?: SplitStatus;

  @IsEnum(SplitType)
  @IsOptional()
  splitType?: SplitType;

  @IsUrl()
  @IsOptional()
  receiptImageUrl?: string;

  @IsDateString()
  @IsOptional()
  paymentDeadline?: string;
}

// ============================================
// UPDATE SPLIT DTO
// ============================================
export class UpdateSplitDto extends PartialType(CreateSplitDto) {}