CREATE TABLE `notice_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`noticeId` int NOT NULL,
	`userId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notice_reads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `files` MODIFY COLUMN `category` varchar(50) NOT NULL DEFAULT '기타';--> statement-breakpoint
ALTER TABLE `notices` ADD `category` varchar(50) DEFAULT '일반' NOT NULL;