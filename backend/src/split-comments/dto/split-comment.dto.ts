import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('split_comments')
export class CreateSplitCommentDto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  splitId!: string;

  @Column()
  userId!: string;

  @Column('text')
  comment!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
