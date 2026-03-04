import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import {
  ExportJob,
  ExportFormat,
  ReportType,
  ExportStatus,
} from "./entities/export-job.entity";
import { ExportTemplate } from "./entities/export-template.entity";
import {
  CreateExportDto,
  CreateExportTemplateDto,
  ExportFilterDto,
  ScheduleExportDto,
} from "./dto/export-request.dto";
import { PdfGeneratorService } from "./pdf-generator.service";
import { QuickBooksGeneratorService } from "./quickbooks-generator.service";
import { OfxGeneratorService } from "./ofx-generator.service";
import { EmailService } from "./email.service";
import { StorageService } from "./storage.service";
import { CsvGeneratorService } from "./csv-generator.service";

// ── Shared interfaces ────────────────────────────────────────────────────────

interface PartnerEntry {
  partnerId: string;
  partnerName: string;
  totalOwedToYou: number;
  totalYouOwe: number;
  netBalance: number;
  expenseCount: number;
  lastInteraction: Date;
}

interface MonthEntry {
  month: string;
  totalExpenses: number;
  totalAmount: number;
  expenseCount: number;
  categories: Record<string, number>;
  settlements: number;
  settlementAmount: number;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectRepository(ExportJob)
    private readonly exportJobRepository: Repository<ExportJob>,
    @InjectRepository(ExportTemplate)
    private readonly exportTemplateRepository: Repository<ExportTemplate>,
    private readonly configService: ConfigService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly quickBooksGeneratorService: QuickBooksGeneratorService,
    private readonly ofxGeneratorService: OfxGeneratorService,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
    private readonly csvGeneratorService: CsvGeneratorService,
    // Uncomment and inject when the services are available:
    // private readonly expensesService: ExpensesService,
    // private readonly splitsService: SplitsService,
    // private readonly usersService: UsersService,
  ) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  async createExport(userId: string, dto: CreateExportDto): Promise<ExportJob> {
    if (dto.filters?.startDate && dto.filters?.endDate) {
      const start = new Date(dto.filters.startDate);
      const end = new Date(dto.filters.endDate);
      if (start > end) {
        throw new BadRequestException("Start date cannot be after end date");
      }
    }

    const exportJob = this.exportJobRepository.create({
      userId,
      format: dto.format,
      reportType: dto.reportType,
      filters: dto.filters ?? {},
      status: ExportStatus.PENDING,
      expiresAt: this.getExpiryDate(),
      emailRecipient: dto.emailRecipient,
      isTaxCompliant: dto.isTaxCompliant ?? false,
      taxYear: dto.taxYear,
      metadata: {
        settings: dto.settings ?? {},
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });

    const savedJob = await this.exportJobRepository.save(exportJob);

    this.processExport(savedJob.id).catch((error) => {
      this.logger.error(`Failed to process export ${savedJob.id}:`, error);
    });

    return savedJob;
  }

  async getExportStatus(jobId: string, userId: string): Promise<ExportJob> {
    const job = await this.exportJobRepository.findOne({
      where: { id: jobId, userId },
    });
    if (!job) throw new NotFoundException(`Export job ${jobId} not found`);
    return job;
  }

  async listExports(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    jobs: ExportJob[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [jobs, total] = await this.exportJobRepository.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { jobs, total, page, totalPages: Math.ceil(total / limit) };
  }

  async downloadExport(
    jobId: string,
    userId: string,
  ): Promise<{ url: string; fileName: string }> {
    const job = await this.exportJobRepository.findOne({
      where: { id: jobId, userId, status: ExportStatus.COMPLETED },
    });
    if (!job) throw new NotFoundException("Export not found or not ready");
    if (new Date() > job.expiresAt) {
      throw new BadRequestException("Export file has expired");
    }
    const downloadUrl = await this.storageService.getSignedUrl(job.s3Key);
    return { url: downloadUrl, fileName: job.fileName };
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  async createTemplate(
    userId: string,
    dto: CreateExportTemplateDto,
  ): Promise<ExportTemplate> {
    if (dto.isDefault) {
      await this.exportTemplateRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }
    const template = this.exportTemplateRepository.create({ userId, ...dto });
    return this.exportTemplateRepository.save(template);
  }

  async listTemplates(userId: string): Promise<ExportTemplate[]> {
    return this.exportTemplateRepository.find({
      where: { userId },
      order: { isDefault: "DESC", createdAt: "DESC" },
    });
  }

  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    const result = await this.exportTemplateRepository.delete({
      id: templateId,
      userId,
    });
    if (result.affected === 0)
      throw new NotFoundException("Template not found");
  }

  async scheduleExport(
    userId: string,
    dto: ScheduleExportDto,
  ): Promise<ExportTemplate> {
    const template = await this.createTemplate(userId, {
      name: dto.name ?? `Scheduled ${dto.reportType} Export`,
      description: `Automated export scheduled with cron: ${dto.scheduleCron}`,
      format: dto.format,
      reportType: dto.reportType,
      // filters is required on CreateExportTemplateDto — fall back to empty object
      filters: dto.filters ?? new ExportFilterDto(),
      settings: dto.settings,
      isDefault: false,
      isScheduled: true,
      scheduleCron: dto.scheduleCron,
    });
    this.scheduleRecurringExport(template);
    return template;
  }

  // ── Cron jobs ──────────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredExports(): Promise<void> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - 1);

    const expiredJobs = await this.exportJobRepository.find({
      where: {
        expiresAt: LessThanOrEqual(expiryDate),
        status: ExportStatus.COMPLETED,
      },
    });

    for (const job of expiredJobs) {
      try {
        if (job.s3Key) await this.storageService.deleteFile(job.s3Key);
        await this.exportJobRepository.update(job.id, {
          status: ExportStatus.EXPIRED,
          // Use empty string instead of null to satisfy `string | (() => string) | undefined`
          fileUrl: "",
          s3Key: "",
        });
        this.logger.log(`Cleaned up expired export: ${job.id}`);
      } catch (error) {
        this.logger.error(`Failed to clean up export ${job.id}:`, error);
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledExports(): Promise<void> {
    const templates = await this.exportTemplateRepository.find({
      where: { isScheduled: true },
    });
    const now = new Date();
    for (const template of templates) {
      if (this.shouldRunScheduledExport(template, now)) {
        try {
          await this.createExport(template.userId, {
            format: template.format,
            reportType: template.reportType,
            filters: template.filters,
            // settings on the entity is ExportTemplateSettings | null; CreateExportDto expects
            // ExportSettingsDto | undefined — convert null → undefined
            settings: template.settings ?? undefined,
            emailRecipient: template.emailRecipients?.[0] ?? undefined,
            isTaxCompliant: template.settings?.includeTaxFields ?? false,
          });
          this.logger.log(
            `Processed scheduled export from template: ${template.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to process scheduled export ${template.id}:`,
            error,
          );
        }
      }
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async processExport(jobId: string): Promise<void> {
    const job = await this.exportJobRepository.findOne({
      where: { id: jobId },
    });
    if (!job) throw new NotFoundException(`Export job ${jobId} not found`);

    try {
      await this.updateJobStatus(jobId, ExportStatus.PROCESSING);

      const data = await this.fetchExportData(
        job.userId,
        job.filters,
        job.reportType,
      );

      let fileBuffer: Buffer;
      let fileName: string;

      switch (job.format) {
        case ExportFormat.CSV:
          fileBuffer = await this.csvGeneratorService.generateCsv(data, job); // ← fix
          fileName = this.generateFileName(job, "csv");
          break;
        case ExportFormat.PDF:
          fileBuffer = await this.pdfGeneratorService.generatePdf(data, job);
          fileName = this.generateFileName(job, "pdf");
          break;
        case ExportFormat.JSON:
          fileBuffer = Buffer.from(JSON.stringify(data, null, 2));
          fileName = this.generateFileName(job, "json");
          break;
        case ExportFormat.QBO:
          fileBuffer = await this.quickBooksGeneratorService.generateQbo(
            data,
            job,
          );
          fileName = this.generateFileName(job, "qbo");
          break;
        case ExportFormat.OFX:
          fileBuffer = await this.ofxGeneratorService.generateOfx(data, job);
          fileName = this.generateFileName(job, "ofx");
          break;
        case ExportFormat.XLSX:
          fileBuffer = await this.csvGeneratorService.generateXlsx(data, job); // ← fix
          fileName = this.generateFileName(job, "xlsx");
          break;
        default:
          throw new BadRequestException(
            `Unsupported export format: ${job.format}`,
          );
      }

      const uploadResult = await this.storageService.uploadFile(
        fileBuffer,
        fileName,
        job.userId,
      );

      await this.exportJobRepository.update(jobId, {
        status: ExportStatus.COMPLETED,
        fileName,
        fileUrl: uploadResult.url,
        s3Key: uploadResult.key,
        fileSize: fileBuffer.length,
        recordCount: data.expenses.length + data.settlements.length,
        summary: this.calculateSummary(data),
        completedAt: new Date(),
      });

      if (job.emailRecipient) await this.sendExportEmail(jobId);

      this.logger.log(`Export ${jobId} completed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process export ${jobId}:`, error);
      await this.exportJobRepository.update(jobId, {
        status: ExportStatus.FAILED,
      });
    }
  }

  private async fetchExportData(
    userId: string,
    filters: ExportFilterDto,
    reportType: ReportType,
  ): Promise<any> {
    // TODO: replace stub arrays with real service calls once injected:
    //   const expenses = await this.expensesService.findAll({ userId, ...filters });
    //   const settlements = await this.splitsService.findSettlements({ userId, ... });
    const expenses: any[] = [];
    const settlements: any[] = [];

    let filteredExpenses = expenses;

    if (filters.participants?.length) {
      filteredExpenses = filteredExpenses.filter((e) =>
        e.participants.some((p: any) =>
          filters.participants!.includes(p.userId),
        ),
      );
    }
    if (filters.paidByMe) {
      filteredExpenses = filteredExpenses.filter((e) => e.paidBy === userId);
    }
    if (filters.owedToMe) {
      filteredExpenses = filteredExpenses.filter((e) =>
        e.participants.some((p: any) => p.userId === userId && p.amount > 0),
      );
    }

    switch (reportType) {
      case ReportType.MONTHLY_SUMMARY:
        return this.formatMonthlySummary(filteredExpenses, settlements);
      case ReportType.ANNUAL_TAX_REPORT:
        return this.formatAnnualTaxReport(filteredExpenses, settlements);
      case ReportType.CATEGORY_BREAKDOWN:
        return this.formatCategoryBreakdown(filteredExpenses, settlements);
      case ReportType.PARTNER_WISE_SUMMARY:
        return this.formatPartnerWiseSummary(
          userId,
          filteredExpenses,
          settlements,
        );
      case ReportType.PAYMENT_HISTORY:
        return this.formatPaymentHistory(filteredExpenses, settlements);
      default:
        return {
          expenses: filteredExpenses,
          settlements,
          metadata: {
            totalExpenses: filteredExpenses.length,
            totalSettlements: settlements.length,
            generatedAt: new Date().toISOString(),
          },
        };
    }
  }

  private formatMonthlySummary(expenses: any[], settlements: any[]) {
    // Typed as Record so string keys are valid
    const monthlyData: Record<string, MonthEntry> = {};

    const ensureMonth = (month: string): void => {
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          totalExpenses: 0,
          totalAmount: 0,
          expenseCount: 0,
          categories: {},
          settlements: 0,
          settlementAmount: 0,
        };
      }
    };

    expenses.forEach((expense) => {
      const month: string = expense.createdAt.toISOString().substring(0, 7);
      ensureMonth(month);
      monthlyData[month].totalExpenses += expense.amount;
      monthlyData[month].expenseCount++;
      if (!monthlyData[month].categories[expense.category]) {
        monthlyData[month].categories[expense.category] = 0;
      }
      monthlyData[month].categories[expense.category] += expense.amount;
    });

    settlements.forEach((settlement) => {
      const month: string = settlement.createdAt.toISOString().substring(0, 7);
      ensureMonth(month);
      monthlyData[month].settlements++;
      monthlyData[month].settlementAmount += settlement.amount;
    });

    return {
      monthlyData: Object.values(monthlyData),
      summary: this.calculateSummary({ expenses, settlements }),
      metadata: {
        reportType: "MONTHLY_SUMMARY",
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private formatAnnualTaxReport(expenses: any[], settlements: any[]) {
    const taxData = {
      businessExpenses: expenses.filter((e) => this.isBusinessExpense(e)),
      personalExpenses: expenses.filter((e) => !this.isBusinessExpense(e)),
      incomeFromSettlements: settlements.filter(
        (s) => s.direction === "incoming",
      ),
      paymentsMade: settlements.filter((s) => s.direction === "outgoing"),
      deductibleAmount: this.calculateDeductibleAmount(expenses),
      taxableIncome: this.calculateTaxableIncome(settlements),
    };

    return {
      ...taxData,
      summary: {
        totalBusinessExpenses: taxData.businessExpenses.reduce(
          (sum: number, e: any) => sum + e.amount,
          0,
        ),
        totalPersonalExpenses: taxData.personalExpenses.reduce(
          (sum: number, e: any) => sum + e.amount,
          0,
        ),
        totalIncome: taxData.incomeFromSettlements.reduce(
          (sum: number, s: any) => sum + s.amount,
          0,
        ),
        totalPayments: taxData.paymentsMade.reduce(
          (sum: number, s: any) => sum + s.amount,
          0,
        ),
        deductibleAmount: taxData.deductibleAmount,
        taxableIncome: taxData.taxableIncome,
      },
      metadata: {
        reportType: "ANNUAL_TAX_REPORT",
        generatedAt: new Date().toISOString(),
        taxDisclaimer:
          "Consult with a tax professional for accurate tax filing",
      },
    };
  }

  private formatCategoryBreakdown(expenses: any[], settlements: any[]) {
    const categoryData: Record<
      string,
      {
        category: string;
        totalAmount: number;
        expenseCount: number;
        averageAmount: number;
        percentage: number;
      }
    > = {};

    expenses.forEach((expense) => {
      if (!categoryData[expense.category]) {
        categoryData[expense.category] = {
          category: expense.category,
          totalAmount: 0,
          expenseCount: 0,
          averageAmount: 0,
          percentage: 0,
        };
      }
      categoryData[expense.category].totalAmount += expense.amount;
      categoryData[expense.category].expenseCount++;
    });

    const totalAmount = Object.values(categoryData).reduce(
      (sum, cat) => sum + cat.totalAmount,
      0,
    );

    Object.values(categoryData).forEach((cat) => {
      cat.averageAmount = cat.totalAmount / cat.expenseCount;
      cat.percentage =
        totalAmount > 0 ? (cat.totalAmount / totalAmount) * 100 : 0;
    });

    return {
      categories: Object.values(categoryData),
      summary: {
        totalAmount,
        totalExpenses: expenses.length,
        categoryCount: Object.keys(categoryData).length,
      },
      metadata: {
        reportType: "CATEGORY_BREAKDOWN",
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private async formatPartnerWiseSummary(
    userId: string,
    expenses: any[],
    settlements: any[],
  ) {
    // Typed Record eliminates all TS7053 index errors
    const partnerData: Record<string, PartnerEntry> = {};

    expenses.forEach((expense) => {
      expense.participants.forEach((participant: any) => {
        if (participant.userId === userId) return;

        const partnerId: string = participant.userId;

        if (!partnerData[partnerId]) {
          partnerData[partnerId] = {
            partnerId,
            partnerName: participant.user?.name ?? "Unknown",
            totalOwedToYou: 0,
            totalYouOwe: 0,
            netBalance: 0,
            expenseCount: 0,
            lastInteraction: expense.createdAt,
          };
        }

        if (expense.paidBy === userId) {
          partnerData[partnerId].totalOwedToYou += participant.amount;
        } else if (expense.paidBy === partnerId) {
          partnerData[partnerId].totalYouOwe += participant.amount;
        }

        partnerData[partnerId].expenseCount++;
        partnerData[partnerId].lastInteraction = new Date(
          Math.max(
            new Date(partnerData[partnerId].lastInteraction).getTime(),
            new Date(expense.createdAt).getTime(),
          ),
        );
      });
    });

    settlements.forEach((settlement) => {
      const partnerId: string = settlement.counterpartyId;

      if (!partnerData[partnerId]) {
        partnerData[partnerId] = {
          partnerId,
          partnerName: "Unknown",
          totalOwedToYou: 0,
          totalYouOwe: 0,
          netBalance: 0,
          expenseCount: 0,
          lastInteraction: settlement.createdAt,
        };
      }

      if (settlement.direction === "incoming") {
        partnerData[partnerId].totalOwedToYou -= settlement.amount;
      } else {
        partnerData[partnerId].totalYouOwe -= settlement.amount;
      }
    });

    // Calculate net balances
    // NOTE: replace the stub below with `this.usersService.findOne(partnerId)`
    // once UsersService is injected in the constructor.
    for (const partnerId of Object.keys(partnerData)) {
      const partner = partnerData[partnerId];
      partner.netBalance = partner.totalOwedToYou - partner.totalYouOwe;

      if (!partner.partnerName || partner.partnerName === "Unknown") {
        try {
          // const user = await this.usersService.findOne(partnerId);
          // partner.partnerName = user?.name ?? 'Unknown';
        } catch (error) {
          this.logger.warn(`Could not fetch user ${partnerId}:`, error);
        }
      }
    }

    return {
      partners: Object.values(partnerData),
      summary: {
        totalOwedToYou: Object.values(partnerData).reduce(
          (sum, p) => sum + p.totalOwedToYou,
          0,
        ),
        totalYouOwe: Object.values(partnerData).reduce(
          (sum, p) => sum + p.totalYouOwe,
          0,
        ),
        netPosition: Object.values(partnerData).reduce(
          (sum, p) => sum + p.netBalance,
          0,
        ),
        partnerCount: Object.keys(partnerData).length,
      },
      metadata: {
        reportType: "PARTNER_WISE_SUMMARY",
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private formatPaymentHistory(expenses: any[], settlements: any[]) {
    const timeline = [
      ...expenses.map((expense) => ({
        type: "EXPENSE" as const,
        date: expense.createdAt,
        amount: expense.amount,
        currency: expense.currency,
        description: expense.description,
        category: expense.category,
        participants: expense.participants.length,
        id: expense.id,
      })),
      ...settlements.map((settlement) => ({
        type: "SETTLEMENT" as const,
        date: settlement.createdAt,
        amount: settlement.amount,
        currency: settlement.currency,
        description: settlement.description ?? "Payment settlement",
        direction: settlement.direction,
        counterparty: settlement.counterpartyName,
        id: settlement.id,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      timeline,
      summary: {
        totalExpenses: expenses.length,
        totalSettlements: settlements.length,
        totalAmount: timeline.reduce((sum, item) => sum + item.amount, 0),
        periodCovered:
          timeline.length > 0
            ? `${new Date(timeline[timeline.length - 1].date).toISOString().split("T")[0]} to ${new Date(timeline[0].date).toISOString().split("T")[0]}`
            : "No data",
      },
      metadata: {
        reportType: "PAYMENT_HISTORY",
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private calculateSummary(data: { expenses?: any[]; settlements?: any[] }) {
    const expenses = data.expenses ?? [];
    const settlements = data.settlements ?? [];

    const currencyBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};
    let totalAmount = 0;

    expenses.forEach((expense: any) => {
      totalAmount += expense.amount;

      if (!currencyBreakdown[expense.currency])
        currencyBreakdown[expense.currency] = 0;
      currencyBreakdown[expense.currency] += expense.amount;

      if (!categoryBreakdown[expense.category])
        categoryBreakdown[expense.category] = 0;
      categoryBreakdown[expense.category] += expense.amount;
    });

    const totalSettlements = settlements.reduce(
      (sum: number, s: any) => sum + s.amount,
      0,
    );

    return {
      totalAmount,
      totalExpenses: expenses.length,
      totalSettlements: settlements.length,
      settlementAmount: totalSettlements,
      currencyBreakdown,
      categoryBreakdown,
    };
  }

  private generateFileName(job: ExportJob, extension: string): string {
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const timestamp = Date.now();
    const prefixMap: Partial<Record<ReportType, string>> = {
      [ReportType.MONTHLY_SUMMARY]: "monthly-summary",
      [ReportType.ANNUAL_TAX_REPORT]: `tax-report-${job.taxYear ?? new Date().getFullYear()}`,
      [ReportType.CATEGORY_BREAKDOWN]: "category-breakdown",
      [ReportType.PARTNER_WISE_SUMMARY]: "partner-summary",
      [ReportType.PAYMENT_HISTORY]: "payment-history",
    };
    const prefix = prefixMap[job.reportType] ?? "export";
    return `${prefix}-${date}-${timestamp}.${extension}`;
  }

  private getExpiryDate(): Date {
    const days = parseInt(
      this.configService.get<string>("EXPORT_EXPIRY_DAYS") ?? "7",
      10,
    );
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  private async updateJobStatus(
    jobId: string,
    status: ExportStatus,
  ): Promise<void> {
    await this.exportJobRepository.update(jobId, { status });
  }

  private async sendExportEmail(jobId: string): Promise<void> {
    const job = await this.exportJobRepository.findOne({
      where: { id: jobId },
    });
    if (!job || !job.emailRecipient || job.emailSent) return;

    try {
      await this.emailService.sendExportEmail(
        job.emailRecipient,
        job.fileName,
        job.fileUrl,
        job.format,
        job.reportType,
      );
      await this.exportJobRepository.update(jobId, {
        emailSent: true,
        emailSentAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to send email for export ${jobId}:`, error);
    }
  }

  private calculateDeductibleAmount(expenses: any[]): number {
    const deductible = [
      "business",
      "office",
      "travel",
      "equipment",
      "education",
      "professional",
    ];
    return expenses
      .filter((e) => deductible.includes(e.category))
      .reduce((sum: number, e: any) => sum + e.amount, 0);
  }

  private calculateTaxableIncome(settlements: any[]): number {
    return settlements
      .filter((s) => s.direction === "incoming")
      .reduce((sum: number, s: any) => sum + s.amount, 0);
  }

  private isBusinessExpense(expense: any): boolean {
    return [
      "business",
      "office",
      "travel",
      "equipment",
      "education",
      "professional",
    ].includes(expense.category);
  }

  async checkEligibility(userId: string): Promise<{
    canExport: boolean;
    exportsThisMonth: number;
    monthlyLimit: number;
    remainingExports: number;
  }> {
    const monthlyLimit = parseInt(
      this.configService.get<string>("EXPORT_MONTHLY_LIMIT") ?? "10",
      10,
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const exportsThisMonth = await this.exportJobRepository.count({
      where: {
        userId,
        createdAt: MoreThanOrEqual(startOfMonth),
      },
    });

    const remainingExports = Math.max(0, monthlyLimit - exportsThisMonth);

    return {
      canExport: remainingExports > 0,
      exportsThisMonth,
      monthlyLimit,
      remainingExports,
    };
  }

  private scheduleRecurringExport(template: ExportTemplate): void {
    this.logger.log(
      `Scheduled export template ${template.id} with cron: ${template.scheduleCron}`,
    );
  }

  private shouldRunScheduledExport(
    template: ExportTemplate,
    now: Date,
  ): boolean {
    if (template.reportType === ReportType.MONTHLY_SUMMARY) {
      return now.getDate() === 1 && now.getHours() === 9;
    }
    return false;
  }
}
