import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeSensorIdToInteger1765628021730 implements MigrationInterface {
    name = 'ChangeSensorIdToInteger1765628021730'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensor_readings" DROP CONSTRAINT "FK_d1df5a824e4467f5a645d7b362a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d1df5a824e4467f5a645d7b362"`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" DROP COLUMN "sensor_id"`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ADD "sensor_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_dca0d491147616dc3794f799a01"`);
        await queryRunner.query(`ALTER TABLE "sensors" DROP CONSTRAINT "sensors_pkey"`);
        await queryRunner.query(`ALTER TABLE "sensors" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "sensors" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sensors" ADD CONSTRAINT "PK_b8bd5fcfd700e39e96bcd9ba6b7" PRIMARY KEY ("id")`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dca0d491147616dc3794f799a0"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "sensor_id"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "sensor_id" integer`);
        await queryRunner.query(`CREATE INDEX "IDX_d1df5a824e4467f5a645d7b362" ON "sensor_readings" ("sensor_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_dca0d491147616dc3794f799a0" ON "events" ("sensor_id") `);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ADD CONSTRAINT "FK_d1df5a824e4467f5a645d7b362a" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_dca0d491147616dc3794f799a01" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_dca0d491147616dc3794f799a01"`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" DROP CONSTRAINT "FK_d1df5a824e4467f5a645d7b362a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dca0d491147616dc3794f799a0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d1df5a824e4467f5a645d7b362"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "sensor_id"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "sensor_id" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_dca0d491147616dc3794f799a0" ON "events" ("sensor_id") `);
        await queryRunner.query(`ALTER TABLE "sensors" DROP CONSTRAINT "PK_b8bd5fcfd700e39e96bcd9ba6b7"`);
        await queryRunner.query(`ALTER TABLE "sensors" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "sensors" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "sensors" ADD CONSTRAINT "sensors_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_dca0d491147616dc3794f799a01" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" DROP COLUMN "sensor_id"`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ADD "sensor_id" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_d1df5a824e4467f5a645d7b362" ON "sensor_readings" ("sensor_id") `);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ADD CONSTRAINT "FK_d1df5a824e4467f5a645d7b362a" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
