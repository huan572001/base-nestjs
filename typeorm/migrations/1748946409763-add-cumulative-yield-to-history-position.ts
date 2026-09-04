import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

module.exports = class AddCumulativeYieldToHistoryPosition1748946409763 implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    await queryRunner.addColumn(
      'history_positions',
      new TableColumn({
        name: 'cumulative_yields',
        type: 'decimal',
        default: 0,
        isNullable: false,
      }),
    );
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.dropColumn('history_positions', 'cumulative_yields');
  }
};
