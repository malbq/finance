CREATE TABLE `CategoryExclusion` (
	`categoryId` text PRIMARY KEY,
	`excludedFromTx` integer DEFAULT false NOT NULL,
	`excludedFromSpending` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`)
);
