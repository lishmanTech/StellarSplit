import { Injectable } from "@nestjs/common";
import { Split } from "../../entities/split.entity";
import { HistoricalRatesService } from "../historical-rates.service";

// pdfkit uses CommonJS exports — import require style avoids the
// "namespace-style import cannot be constructed" TS2351 error
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit") as typeof import("pdfkit");

@Injectable()
export class PDFExporterService {
  constructor(private readonly ratesService: HistoricalRatesService) {}

  async generate(splits: Split[]): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const run = async () => {
        doc.fontSize(20).text("Tax-Ready Expense Report", { align: "center" });
        doc.moveDown();

        for (const split of splits) {
          const fiatAmount = await this.ratesService.convertXlmToFiat(
            Number(split.totalAmount),
            split.createdAt,
          );

          doc
            .fontSize(12)
            .text(`Date: ${split.createdAt.toISOString().split("T")[0]}`);
          doc.text(`Description: ${split.description ?? "N/A"}`);
          doc.text(`Category: ${split.category?.name ?? "Uncategorized"}`);
          doc.text(
            `Amount: ${split.totalAmount} XLM (~$${fiatAmount.toFixed(2)} USD)`,
          );
          doc.text(
            `Tax Deductible: ${split.category?.taxDeductible ? "Yes" : "No"}`,
          );
          doc.moveDown();
        }

        doc.end();
      };

      run().catch(reject);
    });
  }
}
