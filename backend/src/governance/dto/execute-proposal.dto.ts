import { IsString, IsNotEmpty } from 'class-validator';

export class ExecuteProposalDto {
  @IsString()
  @IsNotEmpty()
  proposalId: string;
}

export class VetoProposalDto {
  @IsString()
  @IsNotEmpty()
  proposalId: string;

  @IsString()
  @IsNotEmpty()
  vetoer: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
