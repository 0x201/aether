import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1748575567786 implements MigrationInterface {
    name = 'Initial1748575567786'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`createdTime\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`createdBy\` varchar(200) NOT NULL DEFAULT '', \`lastModifiedTime\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`lastModifiedBy\` varchar(200) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(200) NOT NULL, \`password\` varchar(200) NOT NULL, \`salt\` varchar(128) NOT NULL, \`nickname\` varchar(200) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_USER_USERNAME\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`roles\` (\`createdTime\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`createdBy\` varchar(200) NOT NULL DEFAULT '', \`lastModifiedTime\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`lastModifiedBy\` varchar(200) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(200) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_ROLE_NAME\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_role\` (\`user_id\` int NOT NULL, \`role_id\` int NOT NULL, UNIQUE INDEX \`IDX_USER_ROLE_ROLE_ID\` (\`role_id\`), UNIQUE INDEX \`IDX_USER_ROLE_USER_ID\` (\`user_id\`), PRIMARY KEY (\`user_id\`, \`role_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`books\` (\`createdTime\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`createdBy\` varchar(200) NOT NULL DEFAULT '', \`lastModifiedTime\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`lastModifiedBy\` varchar(200) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(512) NOT NULL, \`price\` decimal(18,2) NOT NULL, \`isbn\` varchar(16) NOT NULL, \`description\` varchar(2048) NULL, \`publishDate\` varchar(10) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_BOOK_ISBN\` (\`isbn\`), UNIQUE INDEX \`IDX_BOOK_TITLE\` (\`title\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`book_author\` (\`book_id\` int NOT NULL, \`author_id\` int NOT NULL, UNIQUE INDEX \`IDX_BOOK_AUTHOR_BOOK_ID\` (\`book_id\`), UNIQUE INDEX \`IDX_BOOK_AUTHOR_AUTHOR_ID\` (\`author_id\`), PRIMARY KEY (\`book_id\`, \`author_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`authors\` (\`createdTime\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`createdBy\` varchar(200) NOT NULL DEFAULT '', \`lastModifiedTime\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`lastModifiedBy\` varchar(200) NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`firstName\` varchar(50) NOT NULL, \`lastName\` varchar(50) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user_role\` ADD CONSTRAINT \`FK_USER_ROLE_USER_ID\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_role\` ADD CONSTRAINT \`FK_USER_ROLE_ROLE_ID\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`book_author\` ADD CONSTRAINT \`FK_BOOK_AUTHOR_BOOK_ID\` FOREIGN KEY (\`book_id\`) REFERENCES \`books\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`book_author\` ADD CONSTRAINT \`FK_BOOK_AUTHOR_AUTHOR_ID\` FOREIGN KEY (\`author_id\`) REFERENCES \`authors\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`book_author\` DROP FOREIGN KEY \`FK_BOOK_AUTHOR_AUTHOR_ID\``);
        await queryRunner.query(`ALTER TABLE \`book_author\` DROP FOREIGN KEY \`FK_BOOK_AUTHOR_BOOK_ID\``);
        await queryRunner.query(`ALTER TABLE \`user_role\` DROP FOREIGN KEY \`FK_USER_ROLE_ROLE_ID\``);
        await queryRunner.query(`ALTER TABLE \`user_role\` DROP FOREIGN KEY \`FK_USER_ROLE_USER_ID\``);
        await queryRunner.query(`DROP TABLE \`authors\``);
        await queryRunner.query(`DROP INDEX \`IDX_BOOK_AUTHOR_AUTHOR_ID\` ON \`book_author\``);
        await queryRunner.query(`DROP INDEX \`IDX_BOOK_AUTHOR_BOOK_ID\` ON \`book_author\``);
        await queryRunner.query(`DROP TABLE \`book_author\``);
        await queryRunner.query(`DROP INDEX \`IDX_BOOK_TITLE\` ON \`books\``);
        await queryRunner.query(`DROP INDEX \`IDX_BOOK_ISBN\` ON \`books\``);
        await queryRunner.query(`DROP TABLE \`books\``);
        await queryRunner.query(`DROP INDEX \`IDX_USER_ROLE_USER_ID\` ON \`user_role\``);
        await queryRunner.query(`DROP INDEX \`IDX_USER_ROLE_ROLE_ID\` ON \`user_role\``);
        await queryRunner.query(`DROP TABLE \`user_role\``);
        await queryRunner.query(`DROP INDEX \`IDX_ROLE_NAME\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
        await queryRunner.query(`DROP INDEX \`IDX_USER_USERNAME\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
