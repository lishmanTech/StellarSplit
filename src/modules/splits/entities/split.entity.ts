import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

// ============================================
// SPLIT ENTITY
// ============================================

export enum SplitStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum SplitType {
  EQUAL = 'equal',
  ITEMIZED = 'itemized',
  PERCENTAGE = 'percentage',
  CUSTOM = 'custom',
}

@Entity('splits')
export class Split {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  creatorId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tipAmount: number;

  @Column({
    type: 'enum',
    enum: SplitStatus,
    default: SplitStatus.DRAFT,
  })
  status: SplitStatus;

  @Column({
    type: 'enum',
    enum: SplitType,
    default: SplitType.EQUAL,
  })
  splitType: SplitType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  receiptImageUrl: string | null;

  @Column({ type: 'timestamp', nullable: true })
  paymentDeadline: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
