import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ConvertDayToTimestamp1685800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Thêm cột mới day_timestamp kiểu bigint
    await queryRunner.addColumn(
      'daily_task_progress',
      new TableColumn({
        name: 'day_timestamp',
        type: 'bigint',
        isNullable: true,
      }),
    );

    // Convert dữ liệu từ date string sang timestamp
    await queryRunner.query(`
      UPDATE daily_task_progress 
      SET day_timestamp = EXTRACT(EPOCH FROM (day || ' 00:00:00')::timestamp) * 1000
      WHERE day IS NOT NULL
    `);

    // Xóa unique constraint cũ
    await queryRunner.dropUniqueConstraint('daily_task_progress', 'UQ_daily_task_progress_day_wallet_address');

    // Xóa cột day cũ
    await queryRunner.dropColumn('daily_task_progress', 'day');

    // Rename cột day_timestamp thành day
    await queryRunner.renameColumn('daily_task_progress', 'day_timestamp', 'day');

    // Set NOT NULL cho cột day mới
    await queryRunner.changeColumn(
      'daily_task_progress',
      'day',
      new TableColumn({
        name: 'day',
        type: 'bigint',
        isNullable: false,
      }),
    );

    // Tạo lại unique constraint với cột mới
    await queryRunner.query(`
      ALTER TABLE daily_task_progress 
      ADD CONSTRAINT UQ_daily_task_progress_day_wallet_address 
      UNIQUE (day, wallet_address)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint('daily_task_progress', 'UQ_daily_task_progress_day_wallet_address');

    await queryRunner.addColumn(
      'daily_task_progress',
      new TableColumn({
        name: 'day_date',
        type: 'date',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE daily_task_progress 
      SET day_date = DATE(TO_TIMESTAMP(day / 1000))
      WHERE day IS NOT NULL
    `);

    await queryRunner.dropColumn('daily_task_progress', 'day');

    await queryRunner.renameColumn('daily_task_progress', 'day_date', 'day');

    await queryRunner.changeColumn(
      'daily_task_progress',
      'day',
      new TableColumn({
        name: 'day',
        type: 'date',
        isNullable: false,
      }),
    );

    await queryRunner.query(`
      ALTER TABLE daily_task_progress 
      ADD CONSTRAINT UQ_daily_task_progress_day_wallet_address 
      UNIQUE (day, wallet_address)
    `);
  }
}
