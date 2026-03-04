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
import { NfcPayloadService } from "./ nfc-payload.service";

interface AuthRequest extends Request {
  user: { id: string; wallet: string };
}

@Controller("api/short-links")
export class ShortLinksController {
  constructor(
    private readonly service: ShortLinksService,
    private readonly nfcService: NfcPayloadService,
  ) {}

  @Post("generate")
  generate(@Body() dto: GenerateLinkDto, @Req() req: AuthRequest) {
    return this.service.generate(dto, req.user.wallet);
  }

  @Get(":shortCode/resolve")
  resolve(@Param("shortCode") code: string, @Req() req: AuthRequest) {
    return this.service.resolve(
      code,
      req.ip ?? "",
      Array.isArray(req.headers["user-agent"])
        ? (req.headers["user-agent"][0] ?? "")
        : (req.headers["user-agent"] ?? ""),
      req.user?.id,
    );
  }

  @Get(":shortCode/analytics")
  analytics(@Param("shortCode") code: string) {
    return this.service.analytics(code);
  }

  @Post("nfc-payload/:splitId")
  generateNfc(@Param("splitId") splitId: string) {
    const url = `${process.env.FRONTEND_URL}/splits/${splitId}`;
    return this.nfcService.generateNdefPayload(url);
  }

  @Delete(":shortCode")
  remove(@Param("shortCode") code: string) {
    return this.service.remove(code);
  }
}
