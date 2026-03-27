import { Module, MiddlewareConsumer } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { RateLimitGuard } from "./rate-limit.guard";
import { IpThrottleGuard } from "./throttle.guard";
import { AuditLogService } from "./audit-log.service";
import helmet from "helmet";
import csrf from "csurf";
import xssClean from "xss-clean";
import rateLimit from "express-rate-limit";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60,
        limit: 100,
      },
    ]),
  ],
  providers: [RateLimitGuard, IpThrottleGuard, AuditLogService],
  exports: [RateLimitGuard, IpThrottleGuard, AuditLogService],
})
export class SecurityModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        helmet(),
        xssClean(),
        csrf({ cookie: true }),
        rateLimit({
          windowMs: 60 * 1000,
          max: 100,
        })
      )
      .forRoutes("*");
  }
}
