import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlarmIdToEvents1766002000000 implements MigrationInterface {
    name = 'AddAlarmIdToEvents1766002000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "alarm_id" integer`);
        await queryRunner.query(`CREATE INDEX "IDX_events_alarm_id" ON "events" ("alarm_id") `);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_events_alarm" FOREIGN KEY ("alarm_id") REFERENCES "alarms"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_events_alarm"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_events_alarm_id"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "alarm_id"`);
    }

}
