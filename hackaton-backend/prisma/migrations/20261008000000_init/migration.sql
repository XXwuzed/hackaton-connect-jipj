-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ADVISOR');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "companyId" TEXT,
    "zoneId" TEXT,
    "storeId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "centerLat" DECIMAL(9,6) NOT NULL,
    "centerLng" DECIMAL(9,6) NOT NULL,
    "radiusMeters" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "nationalId" VARCHAR(10) NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "unsubscribeToken" TEXT NOT NULL,
    "registeredStoreId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "consentAt" TIMESTAMPTZ(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "unsubscribedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsLot" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "pointsRemaining" INTEGER NOT NULL,
    "earnedAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PointsLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsLotUsage" (
    "id" TEXT NOT NULL,
    "redemptionId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsLotUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltySettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "pointsPerDollar" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "LoyaltySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageKey" TEXT,
    "pvp" DECIMAL(10,2) NOT NULL,
    "companyId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSalesSummary" (
    "productId" TEXT NOT NULL,
    "unitsSold" INTEGER NOT NULL,
    "margin" DECIMAL(5,2) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProductSalesSummary_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "RedeemableProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pointsRequired" INTEGER NOT NULL,
    "discountPercent" DECIMAL(5,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RedeemableProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedeemableProductZone" (
    "redeemableProductId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,

    CONSTRAINT "RedeemableProductZone_pkey" PRIMARY KEY ("redeemableProductId","zoneId")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "redeemedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedDate" DATE NOT NULL,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DicePrize" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DicePrize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DicePrizeZone" (
    "dicePrizeId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,

    CONSTRAINT "DicePrizeZone_pkey" PRIMARY KEY ("dicePrizeId","zoneId")
);

-- CreateTable
CREATE TABLE "DiceRoll" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "die1" INTEGER NOT NULL,
    "die2" INTEGER NOT NULL,
    "isWinner" BOOLEAN NOT NULL,
    "purchaseAmount" DECIMAL(10,2) NOT NULL,
    "prizeProductId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiceRoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiceRollPurchasedItem" (
    "diceRollId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DiceRollPurchasedItem_pkey" PRIMARY KEY ("diceRollId","productId")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "Role",
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_zoneId_idx" ON "User"("zoneId");

-- CreateIndex
CREATE INDEX "User_storeId_idx" ON "User"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Store_code_key" ON "Store"("code");

-- CreateIndex
CREATE INDEX "Store_zoneId_idx" ON "Store"("zoneId");

-- CreateIndex
CREATE INDEX "Store_companyId_idx" ON "Store"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_nationalId_key" ON "Customer"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_unsubscribeToken_key" ON "Customer"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_lastName_firstName_idx" ON "Customer"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Customer_zoneId_idx" ON "Customer"("zoneId");

-- CreateIndex
CREATE INDEX "Customer_registeredStoreId_idx" ON "Customer"("registeredStoreId");

-- CreateIndex
CREATE INDEX "Customer_createdAt_idx" ON "Customer"("createdAt");

-- CreateIndex
CREATE INDEX "PointsLot_customerId_expiresAt_idx" ON "PointsLot"("customerId", "expiresAt");

-- CreateIndex
CREATE INDEX "PointsLotUsage_redemptionId_idx" ON "PointsLotUsage"("redemptionId");

-- CreateIndex
CREATE INDEX "PointsLotUsage_lotId_idx" ON "PointsLotUsage"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "ProductSalesSummary_margin_idx" ON "ProductSalesSummary"("margin");

-- CreateIndex
CREATE INDEX "ProductSalesSummary_unitsSold_idx" ON "ProductSalesSummary"("unitsSold");

-- CreateIndex
CREATE UNIQUE INDEX "RedeemableProduct_productId_key" ON "RedeemableProduct"("productId");

-- CreateIndex
CREATE INDEX "RedeemableProductZone_zoneId_idx" ON "RedeemableProductZone"("zoneId");

-- CreateIndex
CREATE INDEX "Redemption_storeId_redeemedAt_idx" ON "Redemption"("storeId", "redeemedAt");

-- CreateIndex
CREATE INDEX "Redemption_customerId_redeemedDate_idx" ON "Redemption"("customerId", "redeemedDate");

-- CreateIndex
CREATE INDEX "Redemption_customerId_productId_redeemedAt_idx" ON "Redemption"("customerId", "productId", "redeemedAt");

-- CreateIndex
CREATE INDEX "Redemption_companyId_redeemedAt_idx" ON "Redemption"("companyId", "redeemedAt");

-- CreateIndex
CREATE INDEX "Redemption_redeemedAt_idx" ON "Redemption"("redeemedAt");

-- CreateIndex
CREATE INDEX "Redemption_advisorId_idx" ON "Redemption"("advisorId");

-- CreateIndex
CREATE INDEX "Redemption_productId_idx" ON "Redemption"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "DicePrize_productId_key" ON "DicePrize"("productId");

-- CreateIndex
CREATE INDEX "DicePrizeZone_zoneId_idx" ON "DicePrizeZone"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "DiceRoll_customerId_key" ON "DiceRoll"("customerId");

-- CreateIndex
CREATE INDEX "DiceRoll_companyId_createdAt_idx" ON "DiceRoll"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "DiceRoll_isWinner_createdAt_idx" ON "DiceRoll"("isWinner", "createdAt");

-- CreateIndex
CREATE INDEX "DiceRoll_advisorId_idx" ON "DiceRoll"("advisorId");

-- CreateIndex
CREATE INDEX "DiceRoll_storeId_idx" ON "DiceRoll"("storeId");

-- CreateIndex
CREATE INDEX "DiceRoll_prizeProductId_idx" ON "DiceRoll"("prizeProductId");

-- CreateIndex
CREATE INDEX "DiceRollPurchasedItem_productId_idx" ON "DiceRollPurchasedItem"("productId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_registeredStoreId_fkey" FOREIGN KEY ("registeredStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLot" ADD CONSTRAINT "PointsLot_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLotUsage" ADD CONSTRAINT "PointsLotUsage_redemptionId_fkey" FOREIGN KEY ("redemptionId") REFERENCES "Redemption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLotUsage" ADD CONSTRAINT "PointsLotUsage_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "PointsLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSalesSummary" ADD CONSTRAINT "ProductSalesSummary_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedeemableProduct" ADD CONSTRAINT "RedeemableProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedeemableProductZone" ADD CONSTRAINT "RedeemableProductZone_redeemableProductId_fkey" FOREIGN KEY ("redeemableProductId") REFERENCES "RedeemableProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedeemableProductZone" ADD CONSTRAINT "RedeemableProductZone_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DicePrize" ADD CONSTRAINT "DicePrize_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DicePrizeZone" ADD CONSTRAINT "DicePrizeZone_dicePrizeId_fkey" FOREIGN KEY ("dicePrizeId") REFERENCES "DicePrize"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DicePrizeZone" ADD CONSTRAINT "DicePrizeZone_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiceRoll" ADD CONSTRAINT "DiceRoll_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiceRoll" ADD CONSTRAINT "DiceRoll_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiceRoll" ADD CONSTRAINT "DiceRoll_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiceRoll" ADD CONSTRAINT "DiceRoll_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiceRoll" ADD CONSTRAINT "DiceRoll_prizeProductId_fkey" FOREIGN KEY ("prizeProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiceRollPurchasedItem" ADD CONSTRAINT "DiceRollPurchasedItem_diceRollId_fkey" FOREIGN KEY ("diceRollId") REFERENCES "DiceRoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiceRollPurchasedItem" ADD CONSTRAINT "DiceRollPurchasedItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Restricciones que Prisma no representa en el schema.
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_nationalId_format_check" CHECK ("nationalId" ~ '^[0-9]{10}$');
ALTER TABLE "PointsLot" ADD CONSTRAINT "PointsLot_points_check" CHECK ("pointsEarned" > 0 AND "pointsRemaining" >= 0 AND "pointsRemaining" <= "pointsEarned");
ALTER TABLE "PointsLotUsage" ADD CONSTRAINT "PointsLotUsage_points_check" CHECK ("points" > 0);
ALTER TABLE "ProductSalesSummary" ADD CONSTRAINT "ProductSalesSummary_unitsSold_check" CHECK ("unitsSold" >= 0);
ALTER TABLE "ProductSalesSummary" ADD CONSTRAINT "ProductSalesSummary_margin_check" CHECK ("margin" BETWEEN -100 AND 100);
ALTER TABLE "RedeemableProduct" ADD CONSTRAINT "RedeemableProduct_pointsRequired_check" CHECK ("pointsRequired" > 0);
ALTER TABLE "RedeemableProduct" ADD CONSTRAINT "RedeemableProduct_discountPercent_check" CHECK ("discountPercent" IS NULL OR "discountPercent" BETWEEN 0 AND 100);
ALTER TABLE "DiceRoll" ADD CONSTRAINT "DiceRoll_dice_values_check" CHECK ("die1" BETWEEN 1 AND 6 AND "die2" BETWEEN 1 AND 6);
ALTER TABLE "DiceRollPurchasedItem" ADD CONSTRAINT "DiceRollPurchasedItem_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "LoyaltySettings" ADD CONSTRAINT "LoyaltySettings_pointsPerDollar_check" CHECK ("pointsPerDollar" > 0);
