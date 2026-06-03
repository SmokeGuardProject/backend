import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToEvents1766003000000 implements MigrationInterface {
  name = 'AddUserIdToEvents1766003000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ADD "user_id" integer`);
    await queryRunner.query(`
      UPDATE "events" "event"
      SET "user_id" = "sensor"."user_id"
      FROM "sensors" "sensor"
      WHERE "event"."sensor_id" = "sensor"."id"
    `);
    await queryRunner.query(`CREATE INDEX "IDX_events_user_id" ON "events" ("user_id")`);
    await queryRunner.query(
      `ALTER TABLE "events" ADD CONSTRAINT "FK_events_user_owner" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_events_user_owner"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_events_user_id"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "user_id"`);
  }
}
