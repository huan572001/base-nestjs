import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTypeToTickets1685950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    CREATE TYPE ticket_type_enum AS ENUM ('daily', 'ref', 'deposit')
  `);

    await queryRunner.addColumn(
      'tickets',
      new TableColumn({
        name: 'type',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
    UPDATE tickets SET type = 'daily' WHERE type IS NULL OR type = ''
  `);

    await queryRunner.query(`
    ALTER TABLE tickets 
    ALTER COLUMN type TYPE ticket_type_enum 
    USING type::ticket_type_enum,
    ALTER COLUMN type SET DEFAULT 'daily',
    ALTER COLUMN type SET NOT NULL
  `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('tickets', 'type');

    await queryRunner.query(`DROP TYPE IF EXISTS ticket_type_enum`);
  }
}
