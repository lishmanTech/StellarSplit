import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { Proposal } from './entities/proposal.entity';
import { Vote } from './entities/vote.entity';
import { ProposalAction } from './entities/proposal-action.entity';
import { GovernanceConfig } from './entities/governance-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proposal,
      Vote,
      ProposalAction,
      GovernanceConfig,
    ]),
  ],
  controllers: [GovernanceController],
  providers: [GovernanceService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
