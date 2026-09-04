import { MigrationInterface, QueryRunner, Table, TableUnique } from 'typeorm';

export class InitTable1678901234567 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'strategies',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'pool_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'clmm_pool_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'inner',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'protocol',
            type: 'varchar',
          },
          {
            name: 'base_token',
            type: 'varchar',
          },
          {
            name: 'quote_token',
            type: 'varchar',
          },
          {
            name: 'apy',
            type: 'varchar',
          },
          {
            name: 'total_value_lock',
            type: 'varchar',
          },
          {
            name: 'management_fee',
            type: 'float',
          },
          {
            name: 'performance_fee',
            type: 'float',
          },
          {
            name: 'capacity',
            type: 'float',
          },
          {
            name: 'lp_breakdown',
            type: 'json',
          },
          {
            name: 'is_active',
            type: 'boolean',
          },
          {
            name: 'feeTier',
            type: 'float',
          },
          {
            name: 'feeRate',
            type: 'float',
          },
          {
            name: 'price',
            type: 'float',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createUniqueConstraint(
      'strategies',
      new TableUnique({
        name: 'UQ_strategies_clmm_pool_id',
        columnNames: ['clmm_pool_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'history_positions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'clmm_pool_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'pool_id',
            type: 'varchar',
          },
          {
            name: 'price',
            type: 'float',
          },
          {
            name: 'lower_range',
            type: 'float',
          },
          {
            name: 'hight_range',
            type: 'float',
          },
          {
            name: 'threshold',
            type: 'float',
          },
          {
            name: 'tvl',
            type: 'varchar',
          },
          {
            name: 'timestamp',
            type: 'bigint',
          },
          {
            name: 'yields',
            type: 'float',
          },
          {
            name: 'apy',
            type: 'varchar',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('strategies');

    await queryRunner.dropTable('history_positions');
  }
}
