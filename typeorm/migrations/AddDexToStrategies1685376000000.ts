import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDexToStrategies1685376000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE strategies ADD COLUMN IF NOT EXISTS dex varchar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE strategies DROP COLUMN IF EXISTS dex
    `);
  }
}
