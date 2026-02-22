import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Vote } from './vote.entity';
import { ProposalAction } from './proposal-action.entity';

export enum ProposalStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUCCEEDED = 'succeeded',
  DEFEATED = 'defeated',
  QUEUED = 'queued',
  EXECUTED = 'executed',
  VETOED = 'vetoed',
  EXPIRED = 'expired',
}

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  proposer: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ProposalStatus,
    default: ProposalStatus.PENDING,
  })
  status: ProposalStatus;

  @Column({ type: 'bigint', default: 0 })
  votesFor: string;

  @Column({ type: 'bigint', default: 0 })
  votesAgainst: string;

  @Column({ type: 'bigint', default: 0 })
  votesAbstain: string;

  @Column({ type: 'timestamp', nullable: true })
  votingStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  votingEndTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  executionTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date;

  @Column({ nullable: true })
  vetoedBy: string;

  @Column({ type: 'text', nullable: true })
  vetoReason: string;

  @Column({ type: 'int', default: 51 })
  quorumPercentage: number;

  @Column({ type: 'bigint', default: 0 })
  totalVotingPower: string;

  @OneToMany(() => Vote, (vote) => vote.proposal, { cascade: true })
  votes: Vote[];

  @OneToMany(() => ProposalAction, (action) => action.proposal, {
    cascade: true,
  })
  actions: ProposalAction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
