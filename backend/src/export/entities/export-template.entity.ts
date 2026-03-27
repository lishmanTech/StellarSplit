import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "@/entities/user.entity";
import { ExportFormat, ReportType } from "./export-job.entity";

export interface ExportTemplateFilters {
  startDate?: string;
  endDate?: string;
  categories?: string[];
  participants?: string[];
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  paidByMe?: boolean;
  owedToMe?: boolean;
  settled?: boolean;
}

export interface ExportTemplateSettings {
  includeTaxFields: boolean;
  includeReceipts: boolean;
  groupByCategory: boolean;
  groupByMonth: boolean;
  includeChart: boolean;
  includeSummary: boolean;
  logoUrl?: string;
  companyName?: string;
  taxId?: string;
}

@Entity("export_templates")
export class ExportTemplate {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column()
  name!: string;

  // nullable: true → TypeScript type must include null
  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    type: "enum",
    enum: ExportFormat,
    default: ExportFormat.CSV,
  })
  format!: ExportFormat;

  @Column({
    type: "enum",
    enum: ReportType,
    default: ReportType.CUSTOM,
  })
  reportType!: ReportType;

  @Column({ type: "jsonb" })
  filters!: ExportTemplateFilters;

  // nullable: true → TypeScript type must include null
  @Column({ type: "jsonb", nullable: true })
  settings!: ExportTemplateSettings | null;

  @Column({ name: "is_default", default: false })
  isDefault!: boolean;

  @Column({ name: "is_scheduled", default: false })
  isScheduled!: boolean;

  // nullable: true → TypeScript type must include null
  @Column({ name: "schedule_cron", nullable: true })
  scheduleCron!: string | null;

  // nullable: true → TypeScript type must include null
  @Column({ name: "email_recipients", type: "jsonb", nullable: true })
  emailRecipients!: string[] | null;

  // nullable: true → TypeScript type must include null
  @Column({ name: "email_subject_template", nullable: true })
  emailSubjectTemplate!: string | null;

  // nullable: true → TypeScript type must include null
  @Column({ name: "email_body_template", type: "text", nullable: true })
  emailBodyTemplate!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
