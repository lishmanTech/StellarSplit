import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CastVoteDto, CastVoteWithTypeDto } from './dto/vote.dto';
import { ExecuteProposalDto, VetoProposalDto } from './dto/execute-proposal.dto';
import { ProposalStatus } from './entities/proposal.entity';

@Controller('governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Post('proposals')
  @HttpCode(HttpStatus.CREATED)
  async createProposal(@Body() dto: CreateProposalDto) {
    const proposal = await this.governanceService.createProposal(dto);
    return {
      success: true,
      data: {
        proposalId: proposal.id,
        proposal,
      },
    };
  }

  @Get('proposals')
  async getProposals(@Query('status') status?: ProposalStatus) {
    const proposals = await this.governanceService.getProposals(status);
    return {
      success: true,
      data: proposals,
    };
  }

  @Get('proposals/:id')
  async getProposal(@Param('id') id: string) {
    const proposal = await this.governanceService.getProposal(id);
    return {
      success: true,
      data: proposal,
    };
  }

  @Post('vote')
  @HttpCode(HttpStatus.OK)
  async vote(@Body() dto: CastVoteDto) {
    await this.governanceService.vote(dto);
    return {
      success: true,
      message: 'Vote cast successfully',
    };
  }

  @Post('vote-with-type')
  @HttpCode(HttpStatus.OK)
  async voteWithType(@Body() dto: CastVoteWithTypeDto) {
    await this.governanceService.voteWithType(dto);
    return {
      success: true,
      message: 'Vote cast successfully',
    };
  }

  @Get('proposals/:id/votes')
  async getVotes(@Param('id') id: string) {
    const votes = await this.governanceService.getVotes(id);
    return {
      success: true,
      data: votes,
    };
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  async executeProposal(@Body() dto: ExecuteProposalDto) {
    await this.governanceService.executeProposal(dto.proposalId);
    return {
      success: true,
      message: 'Proposal executed successfully',
    };
  }

  @Post('veto')
  @HttpCode(HttpStatus.OK)
  async vetoProposal(@Body() dto: VetoProposalDto) {
    await this.governanceService.vetoProposal(
      dto.proposalId,
      dto.vetoer,
      dto.reason,
    );
    return {
      success: true,
      message: 'Proposal vetoed successfully',
    };
  }

  @Post('proposals/:id/finalize')
  @HttpCode(HttpStatus.OK)
  async finalizeProposal(@Param('id') id: string) {
    await this.governanceService.finalizeProposal(id);
    return {
      success: true,
      message: 'Proposal finalized successfully',
    };
  }
}
