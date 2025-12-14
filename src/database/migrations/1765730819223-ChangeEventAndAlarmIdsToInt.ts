import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeEventAndAlarmIdsToInt1765730819223 implements MigrationInterface {
    name = 'ChangeEventAndAlarmIdsToInt1765730819223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_sensors_user_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_6e28bd266f2b68f73f1a5d7a462"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "event_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "event_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "events_pkey"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "alarms" DROP CONSTRAINT "alarms_pkey"`);
        await queryRunner.query(`ALTER TABLE "alarms" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "alarms" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "alarms" ADD CONSTRAINT "PK_b776da486fb19d38b4f7777a6da" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_6e28bd266f2b68f73f1a5d7a462" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_6e28bd266f2b68f73f1a5d7a462"`);
        await queryRunner.query(`ALTER TABLE "alarms" DROP CONSTRAINT "PK_b776da486fb19d38b4f7777a6da"`);
        await queryRunner.query(`ALTER TABLE "alarms" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "alarms" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "alarms" ADD CONSTRAINT "alarms_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "PK_40731c7151fe4be3116e45ddf73"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "event_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "event_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_6e28bd266f2b68f73f1a5d7a462" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "IDX_sensors_user_id" ON "sensors" ("user_id") `);
    }

}
