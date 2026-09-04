import { MigrationInterface, QueryRunner, TableColumn, TableUnique } from 'typeorm';

export class AddUserIdSocialToUsers1685700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Thêm cột user_id_social
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'user_id_social',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Thêm unique constraint cho user_id_social
    await queryRunner.createUniqueConstraint(
      'users',
      new TableUnique({
        name: 'UQ_users_user_id_social',
        columnNames: ['user_id_social'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Xóa unique constraint trước
    await queryRunner.dropUniqueConstraint('users', 'UQ_users_user_id_social');

    // Xóa cột
    await queryRunner.dropColumn('users', 'user_id_social');
  }
}
