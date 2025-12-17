import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteResolveFromEvents1766000259272 implements MigrationInterface {
    name = 'DeleteResolveFromEvents1766000259272'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_52db32e4918e95b033ed9a8d68f"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "resolved"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "resolved_at"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "resolved_by"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "resolved_by" integer`);
        await queryRunner.query(`ALTER TABLE "events" ADD "resolved_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "events" ADD "resolved" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_52db32e4918e95b033ed9a8d68f" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
