import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveAlarmCodeFromAlarms1765734833589 implements MigrationInterface {
    name = 'RemoveAlarmCodeFromAlarms1765734833589'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alarms" DROP CONSTRAINT "alarms_alarm_code_key"`);
        await queryRunner.query(`ALTER TABLE "alarms" DROP COLUMN "alarm_code"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alarms" ADD "alarm_code" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "alarms" ADD CONSTRAINT "alarms_alarm_code_key" UNIQUE ("alarm_code")`);
    }

}
