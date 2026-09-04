import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPoolIdToTransactionEvents1686030000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'transaction_events',
      new TableColumn({
        name: 'pool_id',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('transaction_events', 'pool_id');
  }
}
