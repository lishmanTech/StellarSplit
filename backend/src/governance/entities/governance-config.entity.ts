import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('governance_config')
export class GovernanceConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 51 })
  quorumPercentage: number;

  @Column({ default: 259200 }) // 3 days in seconds
  votingPeriod: number;

  @Column({ default: 172800 }) // 2 days in seconds
  timelockDelay: number;

  @Column({ default: 604800 }) // 7 days in seconds
  proposalLifetime: number;

  @Column({ type: 'bigint', default: '1000000000000' })
  proposalThreshold: string;

  @Column('text', { array: true, default: [] })
  vetoAddresses: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
