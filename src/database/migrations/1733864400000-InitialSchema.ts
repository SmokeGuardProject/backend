import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1733864400000 implements MigrationInterface {
  name = 'InitialSchema1733864400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "full_name" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sensors" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "sensor_code" VARCHAR(50) UNIQUE NOT NULL,
        "location" VARCHAR(255) NOT NULL,
        "floor" INTEGER,
        "building" VARCHAR(100),
        "status" VARCHAR(50) NOT NULL DEFAULT 'inactive',
        "last_checked_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sensor_readings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "sensor_id" uuid NOT NULL,
        "smoke_detected" BOOLEAN NOT NULL,
        "smoke_level" DECIMAL(5,2),
        "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_sensor_readings_sensor" FOREIGN KEY ("sensor_id")
          REFERENCES "sensors"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sensor_readings_sensor_id" ON "sensor_readings"("sensor_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_sensor_readings_timestamp" ON "sensor_readings"("timestamp" DESC)
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "sensor_id" uuid,
        "event_type" VARCHAR(50) NOT NULL,
        "message" TEXT,
        "resolved" BOOLEAN DEFAULT FALSE,
        "resolved_at" TIMESTAMP,
        "resolved_by" INTEGER,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_events_sensor" FOREIGN KEY ("sensor_id")
          REFERENCES "sensors"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_events_user" FOREIGN KEY ("resolved_by")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_events_created_at" ON "events"("created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_events_sensor_id" ON "events"("sensor_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "alarms" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "alarm_code" VARCHAR(50) UNIQUE NOT NULL,
        "location" VARCHAR(255) NOT NULL,
        "status" VARCHAR(50) NOT NULL,
        "activated_at" TIMESTAMP,
        "deactivated_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" INTEGER NOT NULL,
        "event_id" uuid NOT NULL,
        "sent_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_event" FOREIGN KEY ("event_id")
          REFERENCES "events"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "alarms"`);
    await queryRunner.query(`DROP INDEX "idx_events_sensor_id"`);
    await queryRunner.query(`DROP INDEX "idx_events_created_at"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP INDEX "idx_sensor_readings_timestamp"`);
    await queryRunner.query(`DROP INDEX "idx_sensor_readings_sensor_id"`);
    await queryRunner.query(`DROP TABLE "sensor_readings"`);
    await queryRunner.query(`DROP TABLE "sensors"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
