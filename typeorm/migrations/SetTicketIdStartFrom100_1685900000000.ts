import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetTicketIdStartFrom100_1685900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER SEQUENCE tickets_id_seq RESTART WITH 100`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER SEQUENCE tickets_id_seq RESTART WITH 1`);
  }
}
