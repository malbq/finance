CREATE TABLE `Account` (
	`id` text PRIMARY KEY NOT NULL,
	`itemId` text NOT NULL,
	`number` text,
	`type` text NOT NULL,
	`subtype` text,
	`name` text NOT NULL,
	`balance` real NOT NULL,
	`currencyCode` text DEFAULT 'BRL' NOT NULL,
	`marketingName` text,
	`taxNumber` text,
	`owner` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `AcquirerData` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionId` text NOT NULL,
	`data` text,
	FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `AcquirerData_transactionId_unique` ON `AcquirerData` (`transactionId`);--> statement-breakpoint
CREATE TABLE `BankData` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`transferNumber` text,
	`closingBalance` real,
	`automaticallyInvestedBalance` real,
	`overdraftContractedLimit` real,
	`overdraftUsedLimit` real,
	`unarrangedOverdraftAmount` real,
	FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `BankData_accountId_unique` ON `BankData` (`accountId`);--> statement-breakpoint
CREATE TABLE `Category` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`descriptionTranslated` text NOT NULL,
	`parentId` text,
	`parentDescription` text
);
--> statement-breakpoint
CREATE TABLE `CreditCardMetadata` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionId` text NOT NULL,
	`data` text,
	FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `CreditCardMetadata_transactionId_unique` ON `CreditCardMetadata` (`transactionId`);--> statement-breakpoint
CREATE TABLE `CreditData` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`level` text NOT NULL,
	`brand` text NOT NULL,
	`balanceCloseDate` integer,
	`balanceDueDate` integer NOT NULL,
	`availableCreditLimit` real NOT NULL,
	`balanceForeignCurrency` real,
	`minimumPayment` real,
	`creditLimit` real NOT NULL,
	`isLimitFlexible` integer,
	`holderType` text,
	`status` text,
	FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `CreditData_accountId_unique` ON `CreditData` (`accountId`);--> statement-breakpoint
CREATE TABLE `InvestmentTransaction` (
	`id` text PRIMARY KEY NOT NULL,
	`investmentId` text NOT NULL,
	`type` text NOT NULL,
	`movementType` text,
	`quantity` real,
	`value` real,
	`amount` real,
	`netAmount` real,
	`description` text,
	`agreedRate` real,
	`date` integer NOT NULL,
	`tradeDate` integer,
	`brokerageNumber` text,
	`expenses` text,
	FOREIGN KEY (`investmentId`) REFERENCES `Investment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Investment` (
	`id` text PRIMARY KEY NOT NULL,
	`itemId` text NOT NULL,
	`type` text NOT NULL,
	`subtype` text,
	`number` text,
	`balance` real NOT NULL,
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
	`date` integer NOT NULL,
	`owner` text,
	`amountProfit` real,
	`amountWithdrawal` real,
	`amountOriginal` real,
	`dueDate` integer,
	`issuer` text,
	`issuerCNPJ` text,
	`issueDate` integer,
	`rate` real,
	`rateType` text,
	`fixedAnnualRate` real,
	`status` text,
	`institution` text,
	`metadata` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `itemId_id_idx` ON `Investment` (`itemId`,`id`);--> statement-breakpoint
CREATE TABLE `Merchant` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionId` text NOT NULL,
	`cnae` text,
	`cnpj` text,
	`name` text,
	`category` text,
	`businessName` text,
	FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Merchant_transactionId_unique` ON `Merchant` (`transactionId`);--> statement-breakpoint
DROP VIEW IF EXISTS MovingAverageProjections;
--> statement-breakpoint
CREATE VIEW MovingAverageProjections AS WITH
months_range AS (
  SELECT 1 as month_offset, date('now', '-1 month', 'start of month') as month_date
  UNION ALL SELECT 2, date('now', '-2 months', 'start of month')
  UNION ALL SELECT 3, date('now', '-3 months', 'start of month')
  UNION ALL SELECT 4, date('now', '-4 months', 'start of month')
  UNION ALL SELECT 5, date('now', '-5 months', 'start of month')
  UNION ALL SELECT 6, date('now', '-6 months', 'start of month')
),
spending_monthly AS (
  SELECT date(strftime('%Y-%m', datetime(t."date" / 1000, 'unixepoch', '-3 hours')) || '-01') as month_date,
    SUM(ABS(t."amount")) as total
  FROM "Transaction" t JOIN "Account" a ON t."accountId" = a."id"
  WHERE t."type" = 'DEBIT' AND t."categoryId" NOT IN (
    '01000000', '01010000', '01020000', '01030000', '01040000', '01050000', '03000000',
    '03010000', '03020000', '03030000', '03040000', '03050000', '03060000', '03070000',
    '04000000', '05100000', '12'
  )
  GROUP BY month_date
),
spending_average AS (
  SELECT ROUND(
      SUM(spending_monthly.total * (7 - months_range.month_offset)) / 21.0,
      2
    ) as value
  FROM spending_monthly JOIN months_range ON spending_monthly.month_date = months_range.month_date
),
income_monthly AS (
  SELECT 
    date(strftime('%Y-%m', datetime(t."date" / 1000, 'unixepoch', '-3 hours')) || '-01') as month_date,
    SUM(ABS(t."amount")) as total
  FROM "Transaction" t JOIN "Account" a ON t."accountId" = a."id"
  WHERE a."type" = 'BANK' AND t."type" = 'CREDIT' AND t."categoryId" = '01010000'
  GROUP BY month_date
),
income_average AS (
  SELECT ROUND(
      SUM(income_monthly.total * (7 - months_range.month_offset)) / 21.0,
      2
    ) as value
  FROM income_monthly JOIN months_range ON income_monthly.month_date = months_range.month_date
)
SELECT 'Spending' as category, spending_average.value as value
FROM spending_average
UNION ALL
SELECT 'Income' as category, income_average.value as value
FROM income_average;--> statement-breakpoint
CREATE TABLE `PaymentData` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionId` text NOT NULL,
	`paymentMethod` text,
	`reason` text,
	`receiverReferenceId` text,
	`referenceNumber` text,
	`boletoMetadata` text,
	FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PaymentData_transactionId_unique` ON `PaymentData` (`transactionId`);--> statement-breakpoint
CREATE TABLE `PaymentParticipant` (
	`id` text PRIMARY KEY NOT NULL,
	`accountNumber` text,
	`branchNumber` text,
	`documentType` text,
	`documentValue` text,
	`name` text,
	`routingNumber` text,
	`routingNumberISPB` text,
	`payerPaymentDataId` text,
	`receiverPaymentDataId` text,
	FOREIGN KEY (`payerPaymentDataId`) REFERENCES `PaymentData`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiverPaymentDataId`) REFERENCES `PaymentData`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PaymentParticipant_payerPaymentDataId_unique` ON `PaymentParticipant` (`payerPaymentDataId`);--> statement-breakpoint
CREATE UNIQUE INDEX `PaymentParticipant_receiverPaymentDataId_unique` ON `PaymentParticipant` (`receiverPaymentDataId`);--> statement-breakpoint
CREATE TABLE `Transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`description` text NOT NULL,
	`descriptionRaw` text,
	`currencyCode` text DEFAULT 'BRL' NOT NULL,
	`amount` real NOT NULL,
	`amountInAccountCurrency` real,
	`date` integer NOT NULL,
	`category` text,
	`categoryId` text,
	`balance` real,
	`providerCode` text,
	`status` text NOT NULL,
	`type` text NOT NULL,
	`operationType` text,
	`providerId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `account_idx` ON `Transaction` (`accountId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `Transaction` (`date`);