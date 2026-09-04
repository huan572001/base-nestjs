import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTransactionEventsTable1686020000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transaction_events',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'address',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'value_usd',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: false,
            default: 0,
          },
          {
            name: 'data',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'tx_version',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'timestamp',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
        uniques: [
          {
            name: 'UQ_transaction_events_type_tx_version',
            columnNames: ['type', 'tx_version'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transaction_events');
  }
}
