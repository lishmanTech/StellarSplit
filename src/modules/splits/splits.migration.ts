import { MigrationInterface, QueryRunner, Table } from 'typeorm';

// ============================================
// DATABASE MIGRATION
// ============================================
export class CreateSplitTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'splits',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'creatorId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'totalAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'taxAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'tipAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'active', 'completed', 'cancelled'],
            default: "'draft'",
          },
          {
            name: 'splitType',
            type: 'enum',
            enum: ['equal', 'itemized', 'percentage', 'custom'],
            default: "'equal'",
          },
          {
            name: 'receiptImageUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'paymentDeadline',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create index on creatorId for faster queries
    await queryRunner.query(
      `CREATE INDEX "IDX_splits_creatorId" ON "splits" ("creatorId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('splits', 'IDX_splits_creatorId');
    await queryRunner.dropTable('splits');
  }
}
