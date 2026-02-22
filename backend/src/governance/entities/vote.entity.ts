import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Proposal } from './proposal.entity';

export enum VoteType {
  FOR = 'for',
  AGAINST = 'against',
  ABSTAIN = 'abstain',
}

@Entity('votes')
@Index(['proposalId', 'voter'], { unique: true })
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  proposalId: string;

  @Column()
  voter: string;

  @Column({
    type: 'enum',
    enum: VoteType,
  })
  voteType: VoteType;

  @Column({ type: 'bigint' })
  votingPower: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @ManyToOne(() => Proposal, (proposal) => proposal.votes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'proposalId' })
  proposal: Proposal;

  @CreateDateColumn()
  createdAt: Date;
}
