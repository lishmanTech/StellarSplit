import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual } from "typeorm";
import { Receipt } from "./entities/receipt.entity";
import { StorageProviderService } from "./storage-provider.service";
import { ThumbnailService } from "./thumbnail.service";

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt) private readonly repo: Repository<Receipt>,
    private readonly storage: StorageProviderService,
    private readonly thumbnails: ThumbnailService,
  ) {}

  private validateFile(file: Express.Multer.File): void {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/heic",
      "application/pdf",
    ];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException("Unsupported file type");
    }
    if (file.size > 15 * 1024 * 1024) {
      throw new BadRequestException("File exceeds 15MB limit");
    }
  }

  async upload(
    splitId: string,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<Receipt> {
    this.validateFile(file);

    let processedFile = file;
    if (file.mimetype === "image/heic") {
      processedFile = await this.thumbnails.convertHeicToJpg(file);
    }

    const storagePath = await this.storage.saveFile(processedFile);
    const thumbnailPath =
      await this.thumbnails.generateThumbnail(processedFile);

    const receipt = this.repo.create({
      splitId,
      uploadedBy,
      originalFilename: file.originalname,
      storagePath,
      fileSize: file.size,
      mimeType: processedFile.mimetype,
      thumbnailPath,
    });

    return this.repo.save(receipt);
  }

  async listBySplit(splitId: string): Promise<Receipt[]> {
    return this.repo.find({ where: { splitId, isDeleted: false } });
  }

  async getSignedUrl(receiptId: string): Promise<string> {
    const receipt = await this.repo.findOne({ where: { id: receiptId } });

    // TS18047: findOne can return null — guard with NotFoundException
    if (!receipt) throw new NotFoundException(`Receipt ${receiptId} not found`);

    return this.storage.getSignedUrl(receipt.storagePath, 3600);
  }

  async softDelete(receiptId: string): Promise<void> {
    await this.repo.update(receiptId, { isDeleted: true });
  }

  async getOcrData(receiptId: string) {
    const receipt = await this.repo.findOne({ where: { id: receiptId } });

    // TS18047: findOne can return null — guard with NotFoundException
    if (!receipt) throw new NotFoundException(`Receipt ${receiptId} not found`);

    return { processed: receipt.ocrProcessed, data: receipt.extractedData };
  }

  async reprocessOcr(receiptId: string): Promise<void> {
    await this.repo.update(receiptId, {
      ocrProcessed: true,
      ocrConfidenceScore: 0.95,
      // TS2322: TypeORM can't infer the shape of a jsonb column — cast to any
      // so the plain object is accepted without violating _QueryDeepPartialEntity
      extractedData: { text: "Sample OCR result" } as any,
    });
  }

  // Scheduled job: permanently delete soft-deleted receipts older than 30 days
  async permanentCleanup(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    // Original used `createdAt: cutoff` (exact match). Use LessThanOrEqual
    // to correctly find all records deleted before the cutoff date.
    const receipts = await this.repo.find({
      where: { isDeleted: true, createdAt: LessThanOrEqual(cutoff) },
    });

    for (const r of receipts) {
      await this.storage.deleteFile(r.storagePath);
      await this.repo.delete(r.id);
    }
  }
}
