import "express";

declare module "express" {
  interface Request {
    user?: {
      walletAddress?: string;
      [key: string]: any;
    };
    headers: Record<string, string | string[] | undefined>;
    ip: string;
  }
}
