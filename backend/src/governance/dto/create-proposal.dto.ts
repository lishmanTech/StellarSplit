import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ActionType } from '../entities/proposal-action.entity';

export class ProposalActionDto {
  @IsString()
  @IsNotEmpty()
  actionType: ActionType;

  @IsString()
  @IsNotEmpty()
  target: string;

  @IsNotEmpty()
  parameters: Record<string, any>;

  @IsString()
  @IsOptional()
  calldata?: string;
}

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  proposer: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposalActionDto)
  actions: ProposalActionDto[];

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  quorumPercentage?: number;
}
