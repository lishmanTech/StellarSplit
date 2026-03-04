import { Injectable } from "@nestjs/common";
import { ExportJob, ReportType } from "./entities/export-job.entity";

// pdfkit is a CommonJS module — require() gives the constructable default export.
// `import * as PDFDocument` imports the namespace object which has no construct signature.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit") as typeof import("pdfkit");

@Injectable()
export class PdfGeneratorService {
  async generatePdf(data: any, job: ExportJob): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      this.generatePdfContent(doc, data, job);
      doc.end();
    });
  }

  private generatePdfContent(
    doc: PDFKit.PDFDocument,
    data: any,
    job: ExportJob,
  ): void {
    this.addHeader(doc, job);
    this.addTitle(doc, job);

    if (data.summary && job.metadata?.settings?.includeSummary !== false) {
      this.addSummarySection(doc, data.summary);
    }

    switch (job.reportType) {
      case ReportType.MONTHLY_SUMMARY:
        this.addMonthlySummary(doc, data);
        break;
      case ReportType.ANNUAL_TAX_REPORT:
        this.addTaxReport(doc, data);
        break;
      case ReportType.CATEGORY_BREAKDOWN:
        this.addCategoryBreakdown(doc, data);
        break;
      case ReportType.PARTNER_WISE_SUMMARY:
        this.addPartnerSummary(doc, data);
        break;
      case ReportType.PAYMENT_HISTORY:
        this.addPaymentHistory(doc, data);
        break;
      default:
        this.addTransactionList(doc, data);
    }

    this.addFooter(doc, job);
    this.addPageNumbers(doc);
  }

  private addHeader(doc: PDFKit.PDFDocument, job: ExportJob): void {
    const companyName = job.metadata?.settings?.companyName ?? "StellarSplit";
    doc.fontSize(20).fillColor("#333333").text(companyName, 50, 50);
    doc.fontSize(10).fillColor("#666666").text("Expense Report", 50, 75);

    if (job.isTaxCompliant && job.metadata?.settings?.taxId) {
      doc.text(`Tax ID: ${job.metadata.settings.taxId}`, 400, 75, {
        align: "right",
      });
    }
    doc.moveDown(2);
  }

  private addTitle(doc: PDFKit.PDFDocument, job: ExportJob): void {
    const titles: Record<ReportType, string> = {
      [ReportType.MONTHLY_SUMMARY]: "Monthly Expense Summary",
      [ReportType.ANNUAL_TAX_REPORT]: `Annual Tax Report ${job.taxYear ?? new Date().getFullYear()}`,
      [ReportType.CATEGORY_BREAKDOWN]: "Expense Category Breakdown",
      [ReportType.PARTNER_WISE_SUMMARY]: "Partner-wise Expense Summary",
      [ReportType.PAYMENT_HISTORY]: "Payment History Report",
      [ReportType.CUSTOM]: "Custom Expense Report",
    };

    doc
      .fontSize(16)
      .fillColor("#000000")
      .text(titles[job.reportType] ?? "Expense Report", 50, 120);

    if (job.filters?.startDate || job.filters?.endDate) {
      const start = job.filters.startDate
        ? new Date(job.filters.startDate).toLocaleDateString()
        : "Beginning";
      const end = job.filters.endDate
        ? new Date(job.filters.endDate).toLocaleDateString()
        : "Present";
      doc
        .fontSize(10)
        .fillColor("#666666")
        .text(`Period: ${start} to ${end}`, 50, 145);
    }
    doc.moveDown(2);
  }

  private addSummarySection(doc: PDFKit.PDFDocument, summary: any): void {
    doc.fontSize(12).fillColor("#333333").text("Summary", 50, doc.y);
    doc.moveDown(0.5);

    const startX = 50;
    let y = doc.y;

    const rows: [string, string][] = [
      ["Total Amount:", this.formatCurrency(summary.totalAmount)],
      ["Total Expenses:", summary.totalExpenses.toString()],
      ["Total Settlements:", summary.totalSettlements.toString()],
      ["Settlement Amount:", this.formatCurrency(summary.settlementAmount)],
    ];

    doc.fontSize(10).fillColor("#000000");
    rows.forEach(([label, value]) => {
      doc.text(label, startX, y);
      doc.text(value, startX + 200, y, { align: "right" });
      y += 20;
    });

    doc
      .moveTo(startX, y)
      .lineTo(startX + 250, y)
      .stroke("#CCCCCC");
    doc.y = y + 20;
  }

  private addMonthlySummary(doc: PDFKit.PDFDocument, data: any): void {
    doc.fontSize(12).fillColor("#333333").text("Monthly Breakdown", 50, doc.y);
    doc.moveDown(0.5);

    const headers = [
      "Month",
      "Expenses",
      "Amount",
      "Settlements",
      "Settlement Amount",
    ];
    const widths = [100, 80, 80, 80, 100];
    this.addTableHeader(doc, headers, widths);

    let y = doc.y;
    data.monthlyData.forEach((month: any) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        this.addTableHeader(doc, headers, widths);
        y = doc.y;
      }
      doc.fontSize(9).fillColor("#000000");
      doc.text(month.month, 50, y);
      doc.text(month.expenseCount.toString(), 150, y);
      doc.text(this.formatCurrency(month.totalAmount), 230, y);
      doc.text(month.settlements.toString(), 310, y);
      doc.text(this.formatCurrency(month.settlementAmount), 390, y);
      y += 20;
      doc.y = y;
    });
    doc.moveDown(2);
  }

  private addTaxReport(doc: PDFKit.PDFDocument, data: any): void {
    doc
      .fontSize(12)
      .fillColor("#333333")
      .text("Business Expenses (Deductible)", 50, doc.y);
    doc.moveDown(0.5);

    if (data.businessExpenses.length > 0) {
      const headers = ["Date", "Description", "Category", "Amount"];
      const widths = [80, 150, 100, 80];
      this.addTableHeader(doc, headers, widths);

      let y = doc.y;
      let totalBusiness = 0;
      data.businessExpenses.forEach((expense: any) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
          this.addTableHeader(doc, headers, widths);
          y = doc.y;
        }
        doc.fontSize(9).fillColor("#000000");
        doc.text(new Date(expense.createdAt).toLocaleDateString(), 50, y);
        doc.text(`${expense.description.substring(0, 30)}...`, 130, y);
        doc.text(expense.category, 280, y);
        doc.text(this.formatCurrency(expense.amount), 380, y, {
          align: "right",
        });
        totalBusiness += expense.amount;
        y += 20;
        doc.y = y;
      });

      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor("#333333")
        .text(
          `Total Business Expenses: ${this.formatCurrency(totalBusiness)}`,
          380,
          doc.y,
          { align: "right" },
        );
    } else {
      doc
        .fontSize(10)
        .fillColor("#666666")
        .text("No business expenses found", 50, doc.y);
    }

    doc.moveDown(2);
    doc.fontSize(12).fillColor("#333333").text("Tax Summary", 50, doc.y);
    doc.moveDown(0.5);

    const rows: [string, string][] = [
      [
        "Total Business Expenses:",
        this.formatCurrency(data.summary.totalBusinessExpenses),
      ],
      [
        "Total Personal Expenses:",
        this.formatCurrency(data.summary.totalPersonalExpenses),
      ],
      [
        "Total Income from Settlements:",
        this.formatCurrency(data.summary.totalIncome),
      ],
      ["Total Payments Made:", this.formatCurrency(data.summary.totalPayments)],
      [
        "Deductible Amount:",
        this.formatCurrency(data.summary.deductibleAmount),
      ],
      ["Taxable Income:", this.formatCurrency(data.summary.taxableIncome)],
    ];

    let y2 = doc.y;
    rows.forEach(([label, value]) => {
      doc
        .fontSize(10)
        .fillColor("#000000")
        .text(label, 50, y2)
        .text(value, 380, y2, { align: "right" });
      y2 += 20;
    });
    doc.y = y2 + 10;

    doc
      .fontSize(8)
      .fillColor("#FF0000")
      .text(
        "IMPORTANT: This report is for informational purposes only. Please consult with a tax professional for accurate tax filing.",
        50,
        doc.y,
        { width: 400 },
      );
  }

  private addCategoryBreakdown(doc: PDFKit.PDFDocument, data: any): void {
    doc.fontSize(12).fillColor("#333333").text("Expense Categories", 50, doc.y);
    doc.moveDown(0.5);

    const headers = [
      "Category",
      "Total Amount",
      "Count",
      "Average",
      "% of Total",
    ];
    const widths = [120, 100, 60, 80, 80];
    this.addTableHeader(doc, headers, widths);

    let y = doc.y;
    data.categories.forEach((cat: any) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        this.addTableHeader(doc, headers, widths);
        y = doc.y;
      }
      doc.fontSize(9).fillColor("#000000");
      doc.text(cat.category, 50, y);
      doc.text(this.formatCurrency(cat.totalAmount), 170, y);
      doc.text(cat.expenseCount.toString(), 270, y);
      doc.text(this.formatCurrency(cat.averageAmount), 330, y);
      doc.text(`${cat.percentage.toFixed(2)}%`, 410, y);
      y += 20;
      doc.y = y;
    });

    doc.moveDown(2);
    doc
      .fontSize(10)
      .fillColor("#666666")
      .text("Category Distribution Chart:", 50, doc.y);
    doc.moveDown(0.5);

    const barColors: Record<string, string> = {
      food: "#FF6B6B",
      transportation: "#4ECDC4",
      entertainment: "#FFD166",
    };
    data.categories.forEach((cat: any) => {
      const barWidth = (cat.percentage / 100) * 300;
      doc
        .rect(50, doc.y, barWidth, 10)
        .fill(barColors[cat.category] ?? "#118AB2");
      doc
        .fontSize(8)
        .fillColor("#000000")
        .text(`${cat.category}: ${cat.percentage.toFixed(1)}%`, 50, doc.y + 12);
      doc.moveDown(1.5);
    });
  }

  private addPartnerSummary(doc: PDFKit.PDFDocument, data: any): void {
    doc.fontSize(12).fillColor("#333333").text("Partner Summary", 50, doc.y);
    doc.moveDown(0.5);

    const headers = [
      "Partner",
      "Owed to You",
      "You Owe",
      "Net Balance",
      "Expenses",
    ];
    const widths = [150, 90, 90, 90, 60];
    this.addTableHeader(doc, headers, widths);

    let y = doc.y;
    data.partners.forEach((partner: any) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        this.addTableHeader(doc, headers, widths);
        y = doc.y;
      }
      const netColor =
        partner.netBalance > 0
          ? "#00AA00"
          : partner.netBalance < 0
            ? "#FF0000"
            : "#000000";
      doc.fontSize(9).fillColor("#000000");
      doc.text(partner.partnerName, 50, y);
      doc.text(this.formatCurrency(partner.totalOwedToYou), 200, y);
      doc.text(this.formatCurrency(partner.totalYouOwe), 290, y);
      doc
        .fillColor(netColor)
        .text(this.formatCurrency(partner.netBalance), 380, y);
      doc.fillColor("#000000").text(partner.expenseCount.toString(), 470, y);
      y += 20;
      doc.y = y;
    });

    doc.moveDown(1);
    doc.fontSize(10).fillColor("#333333").text("Overall Position:", 50, doc.y);
    doc.text(
      `Total Owed to You: ${this.formatCurrency(data.summary.totalOwedToYou)}`,
      200,
      doc.y,
    );
    doc.text(
      `Total You Owe: ${this.formatCurrency(data.summary.totalYouOwe)}`,
      350,
      doc.y,
    );
    doc.moveDown(1);

    const netColor =
      data.summary.netPosition > 0
        ? "#00AA00"
        : data.summary.netPosition < 0
          ? "#FF0000"
          : "#000000";
    doc
      .fillColor(netColor)
      .text(
        `Net Position: ${this.formatCurrency(data.summary.netPosition)}`,
        50,
        doc.y,
      );
  }

  private addPaymentHistory(doc: PDFKit.PDFDocument, data: any): void {
    doc.fontSize(12).fillColor("#333333").text("Payment History", 50, doc.y);
    doc.moveDown(0.5);

    const headers = ["Date", "Type", "Description", "Amount", "Status"];
    const widths = [80, 80, 150, 80, 60];
    this.addTableHeader(doc, headers, widths);

    let y = doc.y;
    data.timeline.forEach((item: any) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        this.addTableHeader(doc, headers, widths);
        y = doc.y;
      }
      const typeColor = item.type === "EXPENSE" ? "#FF6B6B" : "#4ECDC4";
      doc
        .fontSize(9)
        .fillColor("#000000")
        .text(new Date(item.date).toLocaleDateString(), 50, y);
      doc.fillColor(typeColor).text(item.type, 130, y);
      doc
        .fillColor("#000000")
        .text(`${item.description.substring(0, 30)}...`, 210, y);
      doc.text(this.formatCurrency(item.amount), 360, y);
      doc.text(item.direction ?? "N/A", 440, y);
      y += 20;
      doc.y = y;
    });
  }

  private addTransactionList(doc: PDFKit.PDFDocument, data: any): void {
    doc
      .fontSize(12)
      .fillColor("#333333")
      .text("Transaction Details", 50, doc.y);
    doc.moveDown(0.5);

    if (data.expenses.length > 0) {
      doc.fontSize(11).fillColor("#333333").text("Expenses", 50, doc.y);
      doc.moveDown(0.5);
      data.expenses.forEach((e: any) => {
        this.addTransactionItem(doc, e, "EXPENSE");
        doc.moveDown(0.5);
      });
    }
    if (data.settlements.length > 0) {
      doc.fontSize(11).fillColor("#333333").text("Settlements", 50, doc.y);
      doc.moveDown(0.5);
      data.settlements.forEach((s: any) => {
        this.addTransactionItem(doc, s, "SETTLEMENT");
        doc.moveDown(0.5);
      });
    }
  }

  private addTransactionItem(
    doc: PDFKit.PDFDocument,
    item: any,
    type: string,
  ): void {
    const baseY = doc.y;
    doc.fontSize(9).fillColor("#000000");
    doc.text(
      `${new Date(item.createdAt ?? item.date).toLocaleDateString()} - ${type}`,
      50,
      baseY,
    );
    doc.text(`Description: ${item.description}`, 50, baseY + 15);
    doc.text(
      `Amount: ${this.formatCurrency(item.amount)} ${item.currency}`,
      50,
      baseY + 30,
    );

    if (type === "EXPENSE") {
      doc.text(`Category: ${item.category}`, 200, baseY + 15);
      doc.text(
        `Paid by: ${item.paidByUser?.name ?? item.paidBy}`,
        200,
        baseY + 30,
      );
      doc.text(
        `Participants: ${item.participants?.length ?? 0}`,
        200,
        baseY + 45,
      );
      doc.text(`Settled: ${item.isSettled ? "Yes" : "No"}`, 350, baseY + 15);
    } else {
      doc.text(`Direction: ${item.direction}`, 200, baseY + 15);
      doc.text(`Counterparty: ${item.counterpartyName}`, 200, baseY + 30);
      doc.text(
        `Transaction: ${item.transactionHash?.substring(0, 20) ?? "N/A"}...`,
        200,
        baseY + 45,
      );
    }
    doc.y = baseY + 60;
  }

  private addTableHeader(
    doc: PDFKit.PDFDocument,
    headers: string[],
    widths: number[],
  ): void {
    const startX = 50;
    const startY = doc.y;
    const totalWidth = widths.reduce((a, b) => a + b, 0);

    doc.rect(startX, startY, totalWidth, 25).fill("#333333");
    doc.fontSize(10).fillColor("#FFFFFF");

    let x = startX;
    headers.forEach((header, i) => {
      doc.text(header, x + 5, startY + 8);
      x += widths[i];
    });
    doc.y = startY + 30;
  }

  private addFooter(doc: PDFKit.PDFDocument, _job: ExportJob): void {
    const { count } = doc.bufferedPageRange();
    for (let i = 0; i < count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor("#666666");
      doc.text(
        `Generated by StellarSplit on ${new Date().toLocaleDateString()}`,
        50,
        doc.page.height - 50,
        { align: "center" },
      );
      doc.text(
        "CONFIDENTIAL - For authorized use only",
        50,
        doc.page.height - 30,
        { align: "center" },
      );
    }
  }

  private addPageNumbers(doc: PDFKit.PDFDocument): void {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor("#666666")
        .text(
          `Page ${i + 1} of ${pages.count}`,
          doc.page.width - 100,
          doc.page.height - 30,
        );
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}
