import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastSmokeDetectedToSensors1765998728372 implements MigrationInterface {
    name = 'AddLastSmokeDetectedToSensors1765998728372'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensors" ADD "last_smoke_detected" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensors" DROP COLUMN "last_smoke_detected"`);
    }

}
