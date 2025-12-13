import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeSensorReadingIdsToInt1765628990662 implements MigrationInterface {
    name = 'ChangeSensorReadingIdsToInt1765628990662'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensor_readings" DROP CONSTRAINT "sensor_readings_pkey"`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ADD CONSTRAINT "PK_ae97fcc8df9e5662d9d007d102b" PRIMARY KEY ("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensor_readings" DROP CONSTRAINT "PK_ae97fcc8df9e5662d9d007d102b"`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")`);
    }

}
