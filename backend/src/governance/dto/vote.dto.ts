import { IsString, IsNotEmpty, IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { VoteType } from '../entities/vote.entity';

export class CastVoteDto {
  @IsString()
  @IsNotEmpty()
  proposalId: string;

  @IsString()
  @IsNotEmpty()
  voter: string;

  @IsBoolean()
  support: boolean;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CastVoteWithTypeDto {
  @IsString()
  @IsNotEmpty()
  proposalId: string;

  @IsString()
  @IsNotEmpty()
  voter: string;

  @IsEnum(VoteType)
  voteType: VoteType;

  @IsString()
  @IsOptional()
  reason?: string;
}
