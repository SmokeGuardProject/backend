import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveMessageFromEvents1765733269646 implements MigrationInterface {
    name = 'RemoveMessageFromEvents1765733269646'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "message"`);
        await queryRunner.query(`ALTER TABLE "alarms" ADD "sensor_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "alarms" ADD "floor" integer`);
        await queryRunner.query(`ALTER TABLE "alarms" ADD "building" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "alarms" ADD CONSTRAINT "FK_ad093b2d5eb1aa337f3f99e6f59" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alarms" DROP CONSTRAINT "FK_ad093b2d5eb1aa337f3f99e6f59"`);
        await queryRunner.query(`ALTER TABLE "alarms" DROP COLUMN "building"`);
        await queryRunner.query(`ALTER TABLE "alarms" DROP COLUMN "floor"`);
        await queryRunner.query(`ALTER TABLE "alarms" DROP COLUMN "sensor_id"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "message" text`);
    }

}
