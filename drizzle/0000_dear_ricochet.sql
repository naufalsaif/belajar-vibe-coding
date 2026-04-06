-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `sessions` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`token` varchar(255) NOT NULL,
	`user_id` int(11) DEFAULT 'NULL',
	`created_at` timestamp NOT NULL DEFAULT 'current_timestamp()'
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);

*/