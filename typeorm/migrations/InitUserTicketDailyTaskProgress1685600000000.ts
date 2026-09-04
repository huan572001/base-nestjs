import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class InitUserTicketDailyTaskProgress1685600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // users
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'wallet_address', type: 'varchar', isNullable: false },
          { name: 'ref_code', type: 'varchar', isNullable: true },
          { name: 'ref_by', type: 'varchar', isNullable: true },
          { name: 'telegram_id', type: 'varchar', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_users_wallet_address',
            columnNames: ['wallet_address'],
          }),
          new TableUnique({
            name: 'UQ_users_telegram_id',
            columnNames: ['telegram_id'],
          }),
          new TableUnique({
            name: 'UQ_users_ref_code',
            columnNames: ['ref_code'],
          }),
        ],
      }),
      true,
    );

    // tickets
    await queryRunner.createTable(
      new Table({
        name: 'tickets',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'wallet_address', type: 'varchar', isNullable: false },
          { name: 'is_claim', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // daily_task_progress
    await queryRunner.createTable(
      new Table({
        name: 'daily_task_progress',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'day', type: 'date' },
          { name: 'wallet_address', type: 'varchar' },
          { name: 'is_done', type: 'boolean', default: false },
          { name: 'tasks', type: 'json' },
          { name: 'ticket_id', type: 'int', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_daily_task_progress_day_wallet_address',
            columnNames: ['day', 'wallet_address'],
          }),
        ],
      }),
      true,
    );

    // FK daily_task_progress -> tickets
    await queryRunner.createForeignKey(
      'daily_task_progress',
      new TableForeignKey({
        columnNames: ['ticket_id'],
        referencedTableName: 'tickets',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('daily_task_progress');
    const fk = table?.foreignKeys.find(fk => fk.columnNames.indexOf('ticket_id') !== -1);
    if (fk) {
      await queryRunner.dropForeignKey('daily_task_progress', fk);
    }
    await queryRunner.dropTable('daily_task_progress');
    await queryRunner.dropTable('tickets');
    await queryRunner.dropTable('users');
  }
}
