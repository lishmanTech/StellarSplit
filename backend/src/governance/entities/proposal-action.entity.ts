import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Proposal } from './proposal.entity';

export enum ActionType {
  TRANSFER_FUNDS = 'transfer_funds',
  UPDATE_PARAMETER = 'update_parameter',
  ADD_MEMBER = 'add_member',
  REMOVE_MEMBER = 'remove_member',
  UPGRADE_CONTRACT = 'upgrade_contract',
  CUSTOM = 'custom',
}

@Entity('proposal_actions')
export class ProposalAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  proposalId: string;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  actionType: ActionType;

  @Column()
  target: string;

  @Column({ type: 'jsonb' })
  parameters: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  calldata: string;

  @Column({ default: false })
  executed: boolean;

  @ManyToOne(() => Proposal, (proposal) => proposal.actions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'proposalId' })
  proposal: Proposal;

  @CreateDateColumn()
  createdAt: Date;
}
