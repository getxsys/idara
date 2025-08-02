/*
  Warnings:

  - You are about to drop the column `address` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `clients` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MEETING', 'APPOINTMENT', 'TASK', 'REMINDER', 'DEADLINE', 'PERSONAL', 'TRAVEL', 'BREAK');

-- CreateEnum
CREATE TYPE "EventPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('CONFIRMED', 'TENTATIVE', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AttendeeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE');

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "address",
DROP COLUMN "company",
ADD COLUMN     "averageProjectValue" DOUBLE PRECISION,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "clientStatus" TEXT,
ADD COLUMN     "clientTier" TEXT,
ADD COLUMN     "communicationStyle" TEXT,
ADD COLUMN     "companyLegalName" TEXT,
ADD COLUMN     "companySize" TEXT,
ADD COLUMN     "contractTerms" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "preferredContactMethod" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "stateProvince" TEXT,
ADD COLUMN     "streetAddress" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "totalRevenue" DOUBLE PRECISION,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "type" "EventType" NOT NULL DEFAULT 'MEETING',
    "priority" "EventPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "EventStatus" NOT NULL DEFAULT 'CONFIRMED',
    "organizerId" TEXT NOT NULL,
    "aiSuggestions" JSONB,
    "metadata" JSONB,
    "externalCalendarId" TEXT,
    "externalEventId" TEXT,
    "projectId" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendees" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AttendeeStatus" NOT NULL DEFAULT 'PENDING',
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
