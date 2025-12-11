-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integrations_provider_idx" ON "integrations"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_userId_provider_key" ON "integrations"("userId", "provider");

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
