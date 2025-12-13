import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeSensorCodeToVarchar601765573946961 implements MigrationInterface {
    name = 'ChangeSensorCodeToVarchar601765573946961'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensor_readings" DROP CONSTRAINT "FK_sensor_readings_sensor"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_event"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_events_sensor"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_events_user"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sensor_readings_sensor_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sensor_readings_timestamp"`);
        await queryRunner.query(`DROP INDEX "public"."idx_events_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_events_sensor_id"`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ALTER COLUMN "timestamp" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sensors" DROP CONSTRAINT "sensors_sensor_code_key"`);
        await queryRunner.query(`ALTER TABLE "sensors" DROP COLUMN "sensor_code"`);
        await queryRunner.query(`ALTER TABLE "sensors" ADD "sensor_code" character varying(60) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sensors" ADD CONSTRAINT "UQ_78cd036280aebce0dd342082443" UNIQUE ("sensor_code")`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "resolved" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_09d7dd109cd8f0f1a59aaac78a" ON "sensor_readings" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_d1df5a824e4467f5a645d7b362" ON "sensor_readings" ("sensor_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_dca0d491147616dc3794f799a0" ON "events" ("sensor_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7ebab07668bb225b6a04782a7d" ON "events" ("created_at") `);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ADD CONSTRAINT "FK_d1df5a824e4467f5a645d7b362a" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_6e28bd266f2b68f73f1a5d7a462" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_dca0d491147616dc3794f799a01" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_52db32e4918e95b033ed9a8d68f" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_52db32e4918e95b033ed9a8d68f"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_dca0d491147616dc3794f799a01"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_6e28bd266f2b68f73f1a5d7a462"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" DROP CONSTRAINT "FK_d1df5a824e4467f5a645d7b362a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ebab07668bb225b6a04782a7d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dca0d491147616dc3794f799a0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d1df5a824e4467f5a645d7b362"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_09d7dd109cd8f0f1a59aaac78a"`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "resolved" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sensors" DROP CONSTRAINT "UQ_78cd036280aebce0dd342082443"`);
        await queryRunner.query(`ALTER TABLE "sensors" DROP COLUMN "sensor_code"`);
        await queryRunner.query(`ALTER TABLE "sensors" ADD "sensor_code" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sensors" ADD CONSTRAINT "sensors_sensor_code_key" UNIQUE ("sensor_code")`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ALTER COLUMN "timestamp" SET DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "idx_events_sensor_id" ON "events" ("sensor_id") `);
        await queryRunner.query(`CREATE INDEX "idx_events_created_at" ON "events" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_sensor_readings_timestamp" ON "sensor_readings" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "idx_sensor_readings_sensor_id" ON "sensor_readings" ("sensor_id") `);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_events_user" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_events_sensor" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ADD CONSTRAINT "FK_sensor_readings_sensor" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
