-- AlterTable
ALTER TABLE "User" ALTER COLUMN "lastname" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'DEVELOPER';
