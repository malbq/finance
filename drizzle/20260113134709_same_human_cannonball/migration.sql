-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `Merchant` (
	`id` text NOT NULL,
	`transactionId` text NOT NULL,
	`cnae` text,
	`cnpj` text,
	`name` text,
	`category` text,
	`businessName` text,
	CONSTRAINT `Merchant_pk` PRIMARY KEY(`id`),
	CONSTRAINT `Merchant_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `Account` (
	`id` text NOT NULL,
	`itemId` text NOT NULL,
	`number` text,
	`type` text NOT NULL,
	`subtype` text,
	`name` text NOT NULL,
	`balance` numeric NOT NULL,
	`currencyCode` text DEFAULT 'BRL' NOT NULL,
	`marketingName` text,
	`taxNumber` text,
	`owner` text,
	`createdAt` numeric NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `Account_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Category` (
	`id` text NOT NULL,
	`description` text NOT NULL,
	`descriptionTranslated` text NOT NULL,
	`parentId` text,
	`parentDescription` text,
	CONSTRAINT `Category_pk` PRIMARY KEY(`id`),
	CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `Investment` (
	`id` text NOT NULL,
	`itemId` text NOT NULL,
	`type` text NOT NULL,
	`subtype` text,
	`number` text,
	`balance` numeric NOT NULL,
	`name` text NOT NULL,
	`lastMonthRate` real,
	`lastTwelveMonthsRate` real,
	`annualRate` real,
	`currencyCode` text DEFAULT 'BRL' NOT NULL,
	`code` text,
	`isin` text,
	`value` real,
	`quantity` real,
	`amount` real,
	`taxes` real,
	`taxes2` real,
	`date` numeric NOT NULL,
	`owner` text,
	`amountProfit` real,
	`amountWithdrawal` real,
	`amountOriginal` real,
	`dueDate` numeric,
	`issuer` text,
	`issuerCNPJ` text,
	`issueDate` numeric,
	`rate` real,
	`rateType` text,
	`fixedAnnualRate` real,
	`status` text,
	`institution` text,
	`metadata` text,
	`createdAt` numeric NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `Investment_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Transaction` (
	`id` text NOT NULL,
	`accountId` text NOT NULL,
	`description` text NOT NULL,
	`descriptionRaw` text,
	`currencyCode` text DEFAULT 'BRL' NOT NULL,
	`amount` numeric NOT NULL,
	`amountInAccountCurrency` numeric,
	`date` numeric NOT NULL,
	`category` text,
	`categoryId` text,
	`balance` numeric,
	`providerCode` text,
	`status` text NOT NULL,
	`type` text NOT NULL,
	`operationType` text,
	`providerId` text,
	`createdAt` numeric NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `Transaction_pk` PRIMARY KEY(`id`),
	CONSTRAINT `Transaction_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `CreditData` (
	`id` text NOT NULL,
	`accountId` text NOT NULL,
	`level` text NOT NULL,
	`brand` text NOT NULL,
	`balanceCloseDate` numeric,
	`balanceDueDate` numeric NOT NULL,
	`availableCreditLimit` numeric NOT NULL,
	`balanceForeignCurrency` numeric,
	`minimumPayment` numeric,
	`creditLimit` numeric NOT NULL,
	`isLimitFlexible` numeric,
	`holderType` text,
	`status` text,
	CONSTRAINT `CreditData_pk` PRIMARY KEY(`id`),
	CONSTRAINT `CreditData_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `InvestmentTransaction` (
	`id` text NOT NULL,
	`investmentId` text NOT NULL,
	`type` text NOT NULL,
	`movementType` text,
	`quantity` real,
	`value` real,
	`amount` real,
	`netAmount` real,
	`description` text,
	`agreedRate` real,
	`date` numeric NOT NULL,
	`tradeDate` numeric,
	`brokerageNumber` text,
	`expenses` text,
	CONSTRAINT `InvestmentTransaction_pk` PRIMARY KEY(`id`),
	CONSTRAINT `InvestmentTransaction_investmentId_fkey` FOREIGN KEY (`investmentId`) REFERENCES `Investment`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `SpendingGoal` (
	`categoryId` text NOT NULL,
	`goal` real,
	`tolerance` integer,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `SpendingGoal_pk` PRIMARY KEY(`categoryId`)
);
--> statement-breakpoint
CREATE TABLE `BankData` (
	`id` text NOT NULL,
	`accountId` text NOT NULL,
	`transferNumber` text,
	`closingBalance` real,
	`automaticallyInvestedBalance` real,
	`overdraftContractedLimit` real,
	`overdraftUsedLimit` real,
	`unarrangedOverdraftAmount` real,
	CONSTRAINT `BankData_pk` PRIMARY KEY(`id`),
	CONSTRAINT `fk_BankData_accountId_Account_id_fk` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`)
);
--> statement-breakpoint
CREATE TABLE `PaymentData` (
	`id` text NOT NULL,
	`transactionId` text NOT NULL,
	`paymentMethod` text,
	`reason` text,
	`receiverReferenceId` text,
	`referenceNumber` text,
	`boletoMetadata` text,
	CONSTRAINT `PaymentData_pk` PRIMARY KEY(`id`),
	CONSTRAINT `fk_PaymentData_transactionId_Transaction_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`)
);
--> statement-breakpoint
CREATE TABLE `PaymentParticipant` (
	`id` text NOT NULL,
	`accountNumber` text,
	`branchNumber` text,
	`documentType` text,
	`documentValue` text,
	`name` text,
	`routingNumber` text,
	`routingNumberISPB` text,
	`payerPaymentDataId` text,
	`receiverPaymentDataId` text,
	CONSTRAINT `PaymentParticipant_pk` PRIMARY KEY(`id`),
	CONSTRAINT `fk_PaymentParticipant_receiverPaymentDataId_PaymentData_id_fk` FOREIGN KEY (`receiverPaymentDataId`) REFERENCES `PaymentData`(`id`),
	CONSTRAINT `fk_PaymentParticipant_payerPaymentDataId_PaymentData_id_fk` FOREIGN KEY (`payerPaymentDataId`) REFERENCES `PaymentData`(`id`)
);
--> statement-breakpoint
CREATE TABLE `CreditCardMetadata` (
	`id` text NOT NULL,
	`transactionId` text NOT NULL,
	`data` text,
	CONSTRAINT `CreditCardMetadata_pk` PRIMARY KEY(`id`),
	CONSTRAINT `fk_CreditCardMetadata_transactionId_Transaction_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`)
);
--> statement-breakpoint
CREATE TABLE `AcquirerData` (
	`id` text NOT NULL,
	`transactionId` text NOT NULL,
	`data` text,
	CONSTRAINT `AcquirerData_pk` PRIMARY KEY(`id`),
	CONSTRAINT `fk_AcquirerData_transactionId_Transaction_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `AcquirerData_transactionId_unique` ON `AcquirerData` (`transactionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `BankData_accountId_unique` ON `BankData` (`accountId`);--> statement-breakpoint
CREATE UNIQUE INDEX `CreditCardMetadata_transactionId_unique` ON `CreditCardMetadata` (`transactionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `CreditData_accountId_unique` ON `CreditData` (`accountId`);--> statement-breakpoint
CREATE UNIQUE INDEX `CreditData_accountId_key` ON `CreditData` (`accountId`);--> statement-breakpoint
CREATE INDEX `itemId_id_idx` ON `Investment` (`itemId`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Investment_itemId_id_key` ON `Investment` (`itemId`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Merchant_transactionId_unique` ON `Merchant` (`transactionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `Merchant_transactionId_key` ON `Merchant` (`transactionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `PaymentData_transactionId_unique` ON `PaymentData` (`transactionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `PaymentParticipant_receiverPaymentDataId_unique` ON `PaymentParticipant` (`receiverPaymentDataId`);--> statement-breakpoint
CREATE UNIQUE INDEX `PaymentParticipant_payerPaymentDataId_unique` ON `PaymentParticipant` (`payerPaymentDataId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `Transaction` (`date`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `Transaction` (`accountId`);
*/