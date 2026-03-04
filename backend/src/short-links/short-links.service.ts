import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SplitShortLink } from "./entities/split-short-link.entity";
import { LinkAccessLog } from "./entities/link-access-log.entity";
import { GenerateLinkDto } from "./dto/generate-link.dto";
import * as crypto from "crypto";

@Injectable()
export class ShortLinksService {
  constructor(
    @InjectRepository(SplitShortLink)
    private shortLinkRepo: Repository<SplitShortLink>,

    @InjectRepository(LinkAccessLog)
    private accessLogRepo: Repository<LinkAccessLog>,
  ) {}

  // Generate 6-char unique short code
  private async generateUniqueCode(): Promise<string> {
    // Initialise `code` to a definite string so it is never "used before assigned"
    let code = crypto.randomBytes(4).toString("base64url").slice(0, 6);
    let exists = true;

    while (exists) {
      code = crypto.randomBytes(4).toString("base64url").slice(0, 6);
      const found = await this.shortLinkRepo.findOne({
        where: { shortCode: code },
      });
      exists = !!found;
    }

    return code;
  }

  // Generate link
  async generate(dto: GenerateLinkDto, wallet: string) {
    const count = await this.shortLinkRepo.count({
      where: {
        split: { id: dto.splitId },
        createdBy: wallet,
      },
    });

    if (count >= 20) {
      throw new ForbiddenException("Link generation limit reached");
    }

    const shortCode = await this.generateUniqueCode();

    const expiry = dto.expiryHours
      ? new Date(Date.now() + dto.expiryHours * 3_600_000)
      : new Date(Date.now() + 72 * 3_600_000);

    const link = this.shortLinkRepo.create({
      split: { id: dto.splitId } as any,
      shortCode,
      linkType: dto.linkType,
      targetParticipant: dto.targetParticipantId
        ? ({ id: dto.targetParticipantId } as any)
        : null,
      expiresAt: expiry,
      createdBy: wallet,
    });

    await this.shortLinkRepo.save(link);

    return {
      shortCode,
      url: `${process.env.FRONTEND_URL}/l/${shortCode}`,
      sep0007: this.buildSep0007Uri(dto.splitId),
      expiresAt: expiry,
    };
  }

  // Resolve link
  async resolve(
    shortCode: string,
    ip: string,
    userAgent: string,
    userId?: string,
  ) {
    const link = await this.shortLinkRepo.findOne({
      where: { shortCode },
      relations: ["split"],
    });

    if (!link) throw new NotFoundException("Link not found");
    if (link.expiresAt < new Date())
      throw new BadRequestException("Link expired");
    if (link.maxAccesses && link.accessCount >= link.maxAccesses) {
      throw new ForbiddenException("Max access reached");
    }

    link.accessCount++;
    await this.shortLinkRepo.save(link);

    await this.accessLogRepo.save({
      shortLink: link,
      ipHash: crypto.createHash("sha256").update(ip).digest("hex"),
      userAgent,
      resolvedUserId: userId,
    });

    return {
      redirectUrl: `${process.env.FRONTEND_URL}/splits/${link.split.id}`,
      linkType: link.linkType,
    };
  }

  // Analytics
  async analytics(shortCode: string) {
    const logs = await this.accessLogRepo.find({
      where: { shortLink: { shortCode } },
    });

    return {
      totalAccess: logs.length,
      uniqueIPs: new Set(logs.map((l) => l.ipHash)).size,
      lastAccess: [...logs].sort(
        (a, b) => b.accessedAt.getTime() - a.accessedAt.getTime(),
      )[0],
    };
  }

  // Delete — renamed from `delete` (reserved word) to `remove`
  async remove(shortCode: string): Promise<void> {
    const result = await this.shortLinkRepo.delete({ shortCode });
    if (result.affected === 0) {
      throw new NotFoundException(`Short link "${shortCode}" not found`);
    }
  }

  // SEP-0007 URI
  private buildSep0007Uri(splitId: string): string {
    return `web+stellar:pay?destination=${process.env.PLATFORM_WALLET}&memo=${splitId}`;
  }
}
