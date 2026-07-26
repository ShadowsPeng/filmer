-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `openid` VARCHAR(191) NULL,
    `unionid` VARCHAR(191) NULL,
    `nickname` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'user',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_openid_key`(`openid`),
    UNIQUE INDEX `User_unionid_key`(`unionid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScanShop` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `rating` DOUBLE NOT NULL,
    `basePriceC41` INTEGER NOT NULL,
    `basePriceE6` INTEGER NOT NULL,
    `basePriceBW` INTEGER NOT NULL,
    `hiResFee` INTEGER NOT NULL DEFAULT 0,
    `rushFee` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `outTradeNo` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `filmFormat` VARCHAR(191) NOT NULL,
    `rolls` INTEGER NOT NULL,
    `process` VARCHAR(191) NOT NULL,
    `package` VARCHAR(191) NOT NULL,
    `hiRes` BOOLEAN NOT NULL DEFAULT false,
    `rush` BOOLEAN NOT NULL DEFAULT false,
    `amount` INTEGER NOT NULL,
    `coupon` INTEGER NOT NULL DEFAULT 0,
    `paid` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL,
    `expireAt` DATETIME(3) NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `refundedAt` DATETIME(3) NULL,
    `receiverName` VARCHAR(191) NULL,
    `receiverPhone` VARCHAR(191) NULL,
    `receiverAddr` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_outTradeNo_key`(`outTradeNo`),
    INDEX `Order_userId_status_idx`(`userId`, `status`),
    INDEX `Order_status_expireAt_idx`(`status`, `expireAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderEvent` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `fromStatus` VARCHAR(191) NULL,
    `toStatus` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `payload` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderEvent_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `outTradeNo` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NULL,
    `notifyId` VARCHAR(191) NULL,
    `prepayId` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `successTime` DATETIME(3) NULL,
    `rawNotify` VARCHAR(191) NULL,
    `userOpenid` VARCHAR(191) NOT NULL,
    `appid` VARCHAR(191) NOT NULL,
    `mchid` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentAttempt_outTradeNo_key`(`outTradeNo`),
    UNIQUE INDEX `PaymentAttempt_transactionId_key`(`transactionId`),
    UNIQUE INDEX `PaymentAttempt_notifyId_key`(`notifyId`),
    INDEX `PaymentAttempt_orderId_idx`(`orderId`),
    INDEX `PaymentAttempt_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Refund` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `outRefundNo` VARCHAR(191) NOT NULL,
    `refundId` VARCHAR(191) NULL,
    `notifyId` VARCHAR(191) NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `outTradeNo` VARCHAR(191) NOT NULL,
    `requestedAmount` INTEGER NOT NULL,
    `successAmount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `requestedBy` VARCHAR(191) NOT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `failureReason` VARCHAR(191) NULL,
    `successTime` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Refund_outRefundNo_key`(`outRefundNo`),
    UNIQUE INDEX `Refund_refundId_key`(`refundId`),
    UNIQUE INDEX `Refund_notifyId_key`(`notifyId`),
    INDEX `Refund_orderId_idx`(`orderId`),
    INDEX `Refund_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IdempotencyKey` (
    `key` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `responseBody` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `IdempotencyKey_userId_scope_idx`(`userId`, `scope`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `ScanShop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderEvent` ADD CONSTRAINT `OrderEvent_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentAttempt` ADD CONSTRAINT `PaymentAttempt_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

