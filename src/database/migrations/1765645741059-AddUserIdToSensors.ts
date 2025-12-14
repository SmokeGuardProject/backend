import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdToSensors1765645741059 implements MigrationInterface {
    name = 'AddUserIdToSensors1765645741059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensors" ADD "user_id" integer`);

        const firstUser = await queryRunner.query(`SELECT id FROM "users" ORDER BY id ASC LIMIT 1`);

        if (firstUser.length > 0) {
            const userId = firstUser[0].id;
            await queryRunner.query(`UPDATE "sensors" SET "user_id" = $1 WHERE "user_id" IS NULL`, [userId]);
        }

        await queryRunner.query(`ALTER TABLE "sensors" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_sensors_user_id" ON "sensors" ("user_id")`);
        await queryRunner.query(`ALTER TABLE "sensors" ADD CONSTRAINT "FK_63e4c3eb37adf530a808c763ed0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensors" DROP CONSTRAINT "FK_63e4c3eb37adf530a808c763ed0"`);
        await queryRunner.query(`DROP INDEX "IDX_sensors_user_id"`);
        await queryRunner.query(`ALTER TABLE "sensors" DROP COLUMN "user_id"`);
    }

}
