import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { ShortLinksService } from "./short-links.service";
import { GenerateLinkDto } from "./dto/generate-link.dto";
import { NfcPayloadService } from "./nfc-payload.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthUser } from "../auth/types/auth-user.interface";

@Controller("short-links")
export class ShortLinksController {
  constructor(
    private readonly service: ShortLinksService,
    private readonly nfcService: NfcPayloadService,
  ) {}

  @Post("generate")
  generate(@Body() dto: GenerateLinkDto, @CurrentUser() user: AuthUser) {
    return this.service.generate(dto, user.walletAddress);
  }

  @Get(":shortCode/resolve")
  resolve(@Param("shortCode") code: string, @Req() req: any, @CurrentUser() user?: AuthUser) {
    return this.service.resolve(
      code,
      req.ip ?? "",
      Array.isArray(req.headers["user-agent"])
        ? (req.headers["user-agent"][0] ?? "")
        : (req.headers["user-agent"] ?? ""),
      user?.id,
    );
  }

  @Get(":shortCode/analytics")
  analytics(@Param("shortCode") code: string, @CurrentUser() user: AuthUser) {
    return this.service.analytics(code, user.walletAddress);
  }

  @Post("nfc-payload/:splitId")
  generateNfc(@Param("splitId") splitId: string) {
    const url = `${process.env.FRONTEND_URL}/splits/${splitId}`;
    return this.nfcService.generateNdefPayload(url);
  }

  @Delete(":shortCode")
  remove(@Param("shortCode") code: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(code, user.walletAddress);
  }
}
