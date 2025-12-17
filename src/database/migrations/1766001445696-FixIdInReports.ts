import { MigrationInterface, QueryRunner } from "typeorm";

export class FixIdInReports1766001445696 implements MigrationInterface {
    name = 'FixIdInReports1766001445696'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ADD "message" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "read" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "notifications_pkey"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "read"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "message"`);
    }

}
