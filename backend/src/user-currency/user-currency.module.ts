import { CurrencyRateCache } from "@/currency/entities/currency-rate-cache.entity";
import { UserCurrencyPreference } from "@/currency/entities/user-currency-preference.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CurrencyService } from "./user-currency.service";
import { GeoModule } from "@/currency/geo/geo.module";
import { CurrencyController } from "./user-currency.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCurrencyPreference, CurrencyRateCache]),
    GeoModule,
  ],
  providers: [CurrencyService],
  controllers: [CurrencyController],
  exports: [CurrencyService],
})
export class UserCurrencyModule {}
