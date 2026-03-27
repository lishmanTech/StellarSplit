import { Controller, Get, Put, Post, Query, Body, Req } from "@nestjs/common";
import { Request } from "express";
import { CurrencyService } from "./user-currency.service";

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

interface ConvertBody {
  base: string;
  target: string;
  amount: number;
}

@Controller("api/currency")
export class CurrencyController {
  constructor(private readonly service: CurrencyService) {}

  @Get("detect")
  detect(@Req() req: Request) {
    return this.service.detectCurrency(req.ip ?? "");
  }

  @Get("preferences")
  getPref(@Req() req: AuthenticatedRequest) {
    return this.service.getOrCreatePreference(req.user.id, req.ip ?? "");
  }

  @Put("preferences")
  updatePref(
    @Req() req: AuthenticatedRequest,
    @Body("currency") currency: string,
  ) {
    return this.service.updatePreference(req.user.id, currency);
  }

  @Get("rates")
  async getRates(
    @Query("base") base: string,
    @Query("targets") targets: string,
  ) {
    const list = targets.split(",");
    const result: Record<string, number> = {};

    for (const t of list) {
      result[t] = await this.service.getRate(base, t);
    }

    return result;
  }

  @Post("convert")
  convert(@Body() body: ConvertBody) {
    return this.service.convert(body.base, body.target, body.amount);
  }

  @Get("supported")
  supported() {
    return {
      fiatSupported: 170,
      cryptoSupported: ["XLM", "USDC"],
    };
  }
}
