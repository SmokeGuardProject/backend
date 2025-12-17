import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTemperatureAndHumidityToSensors1765920196989 implements MigrationInterface {
    name = 'AddTemperatureAndHumidityToSensors1765920196989'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensor_readings" ADD "temperature" numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" ADD "humidity" numeric(5,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensor_readings" DROP COLUMN "humidity"`);
        await queryRunner.query(`ALTER TABLE "sensor_readings" DROP COLUMN "temperature"`);
    }

}
