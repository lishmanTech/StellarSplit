declare module "@apla/clickhouse" {
  interface ClickHouseOptions {
    host?: string;
    port?: number | string;
    user?: string;
    password?: string;
    database?: string;
  }

  class ClickHouse {
    constructor(options: ClickHouseOptions);
    query<T = any>(sql: string): Promise<T[]>;
    insert<T = any>(table: string, data: T): Promise<void>;
  }

  export = ClickHouse;
}
