import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1748872197887 implements MigrationInterface {
    name = 'Initial1748872197887'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "roles" ("id" int NOT NULL IDENTITY(1,1), "name" varchar(200) NOT NULL, "isActive" bit NOT NULL CONSTRAINT "DF_37d2c91c50b3fb3e3f08372457c" DEFAULT 1, "createdTime" datetime2 NOT NULL CONSTRAINT "DF_31ba3fc97de8d9d24f5a07c1d2b" DEFAULT getdate(), "createdBy" nvarchar(200) NOT NULL CONSTRAINT "DF_6357b83a9289a619b607658411c" DEFAULT '', "lastModifiedTime" datetime2 CONSTRAINT "DF_0be52a4dbeec9caafc39ef4e4f2" DEFAULT getdate(), "lastModifiedBy" nvarchar(200), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ROLE_NAME" ON "roles" ("name") `);
        await queryRunner.query(`CREATE TABLE "user_role" ("user_id" int NOT NULL, "role_id" int NOT NULL, CONSTRAINT "PK_f634684acb47c1a158b83af5150" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_USER_ROLE_ROLE_ID" ON "user_role" ("role_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_USER_ROLE_USER_ID" ON "user_role" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" int NOT NULL IDENTITY(1,1), "username" varchar(200) NOT NULL, "password" varchar(200) NOT NULL, "salt" varchar(128) NOT NULL, "nickname" varchar(200), "isActive" bit NOT NULL CONSTRAINT "DF_409a0298fdd86a6495e23c25c66" DEFAULT 1, "createdTime" datetime2 NOT NULL CONSTRAINT "DF_80b139191aaf327bdce465b43a4" DEFAULT getdate(), "createdBy" nvarchar(200) NOT NULL CONSTRAINT "DF_d1c708d852dcfde10fa0fd12fa2" DEFAULT '', "lastModifiedTime" datetime2 CONSTRAINT "DF_fffe96c62a4be095e9a342bef93" DEFAULT getdate(), "lastModifiedBy" nvarchar(200),  CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_USER_USERNAME" ON "users" ("username") `);
        await queryRunner.query(`CREATE TABLE "books" ("id" int NOT NULL IDENTITY(1,1), "title" varchar(512) NOT NULL, "price" decimal(18,2) NOT NULL, "isbn" varchar(16) NOT NULL, "description" varchar(2048), "publishDate" varchar(10), "isActive" bit NOT NULL CONSTRAINT "DF_5a593ac583cbd3b633dd3f88b46" DEFAULT 1, "createdTime" datetime2 NOT NULL CONSTRAINT "DF_f79913cd6238c044a9cf4acc4fc" DEFAULT getdate(), "createdBy" nvarchar(200) NOT NULL CONSTRAINT "DF_7af212908c0d645d7644533534d" DEFAULT '', "lastModifiedTime" datetime2 CONSTRAINT "DF_5bb3e1d666ae93a1e0f20109c97" DEFAULT getdate(), "lastModifiedBy" nvarchar(200), CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_BOOK_ISBN" ON "books" ("isbn") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_BOOK_TITLE" ON "books" ("title") `);
        await queryRunner.query(`CREATE TABLE "authors" ("id" int NOT NULL IDENTITY(1,1), "firstName" varchar(50) NOT NULL, "lastName" varchar(50) NOT NULL, "isActive" bit NOT NULL CONSTRAINT "DF_ee8b278cccd572d91d1b45a51ca" DEFAULT 1, "createdTime" datetime2 NOT NULL CONSTRAINT "DF_2a7b77cd15d440b3f76d410640e" DEFAULT getdate(), "createdBy" nvarchar(200) NOT NULL CONSTRAINT "DF_1dbf6cb22948d1cb67fee06d9bc" DEFAULT '', "lastModifiedTime" datetime2 CONSTRAINT "DF_8deea9583cb3cbbfe7a2ca58944" DEFAULT getdate(), "lastModifiedBy" nvarchar(200), CONSTRAINT "PK_d2ed02fabd9b52847ccb85e6b88" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "book_author" ("book_id" int NOT NULL, "author_id" int NOT NULL, CONSTRAINT "PK_a34e1d3551a22a871f8f0d32347" PRIMARY KEY ("book_id", "author_id"))`);
        await queryRunner.query(`CREATE TABLE "menus" ("id" int NOT NULL IDENTITY(1,1), "name" varchar(100) NOT NULL, "title" varchar(100) NOT NULL, "icon" varchar(200), "route" varchar(200), "order" int NOT NULL, "parentId" int, "isActive" bit NOT NULL CONSTRAINT "DF_eca40fc97be5046210ec1c07fe0" DEFAULT 1, "createdTime" datetime2 NOT NULL CONSTRAINT "DF_532d0d9cca55a1a88037c57556a" DEFAULT getdate(), "createdBy" nvarchar(200) NOT NULL CONSTRAINT "DF_61e3248522c02038026978215bc" DEFAULT '', "lastModifiedTime" datetime2 CONSTRAINT "DF_758e1200f73303e14070d57c1d7" DEFAULT getdate(), "lastModifiedBy" nvarchar(200), CONSTRAINT "PK_642aa99e00d262c0c16acce60e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "menu_role" ("menu_id" int NOT NULL, "role_id" int NOT NULL, CONSTRAINT "PK_9331175757924005ece622a047d" PRIMARY KEY ("menu_id", "role_id"))`);
        await queryRunner.query(`ALTER TABLE "user_role" ADD CONSTRAINT "FK_USER_ROLE_USER_ID" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_role" ADD CONSTRAINT "FK_USER_ROLE_ROLE_ID" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book_author" ADD CONSTRAINT "FK_BOOK_AUTHOR_BOOK_ID" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book_author" ADD CONSTRAINT "FK_BOOK_AUTHOR_AUTHOR_ID" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "menu_role" ADD CONSTRAINT "FK_MENU_ROLE_MENU_ID" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "menu_role" ADD CONSTRAINT "FK_MENU_ROLE_ROLE_ID" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "menu_role" DROP CONSTRAINT "FK_MENU_ROLE_ROLE_ID"`);
        await queryRunner.query(`ALTER TABLE "menu_role" DROP CONSTRAINT "FK_MENU_ROLE_MENU_ID"`);
        await queryRunner.query(`ALTER TABLE "book_author" DROP CONSTRAINT "FK_BOOK_AUTHOR_AUTHOR_ID"`);
        await queryRunner.query(`ALTER TABLE "book_author" DROP CONSTRAINT "FK_BOOK_AUTHOR_BOOK_ID"`);
        await queryRunner.query(`ALTER TABLE "user_role" DROP CONSTRAINT "FK_USER_ROLE_ROLE_ID"`);
        await queryRunner.query(`ALTER TABLE "user_role" DROP CONSTRAINT "FK_USER_ROLE_USER_ID"`);
        await queryRunner.query(`DROP TABLE "menu_role"`);
        await queryRunner.query(`DROP TABLE "menus"`);
        await queryRunner.query(`DROP TABLE "book_author"`);
        await queryRunner.query(`DROP TABLE "authors"`);
        await queryRunner.query(`DROP INDEX "IDX_BOOK_TITLE" ON "books"`);
        await queryRunner.query(`DROP INDEX "IDX_BOOK_ISBN" ON "books"`);
        await queryRunner.query(`DROP TABLE "books"`);
        await queryRunner.query(`DROP INDEX "IDX_USER_USERNAME" ON "users"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_role"`);
        await queryRunner.query(`DROP INDEX "IDX_ROLE_NAME" ON "roles"`);
        await queryRunner.query(`DROP TABLE "roles"`);
    }

}
