import { MigrationInterface, QueryRunner, Table, TableUnique } from 'typeorm';

export class CreatePointsTable1685970000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tạo bảng points
    await queryRunner.createTable(
      new Table({
        name: 'points',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'day',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'wallet_address',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'point',
            type: 'numeric',
            precision: 20,
            scale: 18,
            isNullable: false,
            default: '0',
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
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'points',
      new TableUnique({
        name: 'UQ_points_day_wallet_address',
        columnNames: ['day', 'wallet_address'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint('points', 'UQ_points_day_wallet_address');

    await queryRunner.dropTable('points');
  }
}
