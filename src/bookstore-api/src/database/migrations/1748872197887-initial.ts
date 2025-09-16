import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1748872197887 implements MigrationInterface {
  name = 'Initial1748872197887';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "Roles" (
            "Id" int NOT NULL IDENTITY(1,1),
            "Name" varchar(200) NOT NULL,
            "IsActive" bit NOT NULL CONSTRAINT "DF_Roles_IsActive_Default" DEFAULT 1,
            "CreatedTime" datetime NOT NULL CONSTRAINT "DF_Roles_CreatedTime_Default" DEFAULT GETDATE(),
            "CreatedBy" nvarchar(200) NOT NULL CONSTRAINT "DF_Roles_CreatedBy_Default" DEFAULT '',
            "LastModifiedTime" datetime CONSTRAINT "DF_Roles_LastModifiedTime_Default" DEFAULT GETDATE(),
            "LastModifiedBy" nvarchar(200),
            CONSTRAINT "PK_Roles_Id" PRIMARY KEY ("Id"))`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ROLE_NAME" ON "Roles" ("Name") `,
    );
    await queryRunner.query(`CREATE TABLE "UserRole" (
            "Id" int NOT NULL IDENTITY(1,1),
            "UserId" int NOT NULL,
            "RoleId" int NOT NULL,
            "AssignedAt" datetime CONSTRAINT "DF_UserRole_AssignedAt_Default" DEFAULT GETDATE(),
            "AssignedBy" nvarchar(200),
            CONSTRAINT "PK_UserRole_Id" PRIMARY KEY ("Id"))`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_UserRole_UserId_RoleId" ON "UserRole" ("RoleId", "UserId") `,
    );
    await queryRunner.query(`CREATE TABLE "Users" (
            "Id" int NOT NULL IDENTITY(1,1),
            "Username" varchar(200) NOT NULL,
            "Password" varchar(200) NOT NULL,
            "Nickname" varchar(200),
            "IsActive" bit NOT NULL CONSTRAINT "DF_Users_IsActive_Default" DEFAULT 1,
            "CreatedTime" datetime NOT NULL CONSTRAINT "DF_Users_CreatedTime_Default" DEFAULT GETDATE(),
            "CreatedBy" nvarchar(200) NOT NULL CONSTRAINT "DF_Users_CreatedBy_Default" DEFAULT '',
            "LastModifiedTime" datetime CONSTRAINT "DF_Users_LastModifiedTime_Default" DEFAULT GETDATE(),
            "LastModifiedBy" nvarchar(200), 
            CONSTRAINT "PK_Users_Id" PRIMARY KEY ("Id"))`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_USER_USERNAME" ON "Users" ("Username") `,
    );
    await queryRunner.query(`CREATE TABLE "Books" (
            "Id" int NOT NULL IDENTITY(1,1),
            "Title" varchar(512) NOT NULL,
            "Price" decimal(18,2) NOT NULL,
            "Isbn" varchar(16) NOT NULL,
            "Description" varchar(2048),
            "PublishDate" varchar(10), 
            "IsActive" bit NOT NULL CONSTRAINT "DF_Books_IsActive_Default" DEFAULT 1,
            "CreatedTime" datetime NOT NULL CONSTRAINT "DF_Books_CreatedTime_Default" DEFAULT GETDATE(),
            "CreatedBy" nvarchar(200) NOT NULL CONSTRAINT "DF_Books_CreatedBy_Default" DEFAULT '',
            "LastModifiedTime" datetime CONSTRAINT "DF_Books_LastModifiedTime_Default" DEFAULT GETDATE(),
            "LastModifiedBy" nvarchar(200),
            CONSTRAINT "PK_Books_Id" PRIMARY KEY ("Id"))`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_BOOK_ISBN" ON "Books" ("Isbn") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_BOOK_TITLE" ON "Books" ("Title") `,
    );
    await queryRunner.query(`CREATE TABLE "Authors" (
            "Id" int NOT NULL IDENTITY(1,1),
            "FirstName" varchar(50) NOT NULL,
            "LastName" varchar(50) NOT NULL,
            "IsActive" bit NOT NULL CONSTRAINT "DF_Authors_IsActive_Default" DEFAULT 1,
            "CreatedTime" datetime NOT NULL CONSTRAINT "DF_Authors_CreatedTime_Default" DEFAULT GETDATE(),
            "CreatedBy" nvarchar(200) NOT NULL CONSTRAINT "DF_Authors_CreatedBy_Default" DEFAULT '',
            "LastModifiedTime" datetime CONSTRAINT "DF_Authors_LastModifiedTime_Default" DEFAULT GETDATE(),
            "LastModifiedBy" nvarchar(200),
            CONSTRAINT "PK_Authors_Id" PRIMARY KEY ("Id"))`);
    await queryRunner.query(`CREATE TABLE "BookAuthor" (
            "Id" int NOT NULL IDENTITY(1,1),
            "BookId" int NOT NULL, 
            "AuthorId" int NOT NULL, 
            CONSTRAINT "PK_BookAuthor_Id" PRIMARY KEY ("Id"))`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_BookAuthor_BookId_AuthorId" ON "BookAuthor" ("BookId", "AuthorId") `,
    );
    await queryRunner.query(`CREATE TABLE "Menus" (
            "Id" int NOT NULL IDENTITY(1,1),
            "Name" varchar(100) NOT NULL,
            "Title" varchar(100) NOT NULL,
            "Icon" varchar(200),
            "Route" varchar(200),
            "Order" int NOT NULL,
            "ParentId" int,
            "IsActive" bit NOT NULL CONSTRAINT "DF_Menus_IsActive_Default" DEFAULT 1,
            "CreatedTime" datetime NOT NULL CONSTRAINT "DF_Menus_CreatedTime_Default" DEFAULT GETDATE(),
            "CreatedBy" nvarchar(200) NOT NULL CONSTRAINT "DF_Menus_CreatedBy_Default" DEFAULT '',
            "LastModifiedTime" datetime CONSTRAINT "DF_Menus_LastModifiedTime_Default" DEFAULT GETDATE(),
            "LastModifiedBy" nvarchar(200),
            CONSTRAINT "PK_Menus_Id" PRIMARY KEY ("Id"))`);
    await queryRunner.query(`CREATE TABLE "RoleMenu" (
            "Id" int NOT NULL IDENTITY(1,1),
            "MenuId" int NOT NULL,
            "RoleId" int NOT NULL,
            "AssignedAt" datetime CONSTRAINT "DF_RoleMenu_AssignedAt_Default" DEFAULT GETDATE(),
            "AssignedBy" nvarchar(200),
            CONSTRAINT "PK_Role_Menu_Id" PRIMARY KEY ("Id"))`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_RoleMenu_RoleId_MenuId" ON "RoleMenu" ("RoleId", "MenuId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_RoleMenu_RoleId_MenuId" ON "RoleMenu"`);
    await queryRunner.query(`DROP TABLE "RoleMenu"`);

    await queryRunner.query(`DROP TABLE "Menus"`);

    await queryRunner.query(`DROP INDEX "IDX_BookAuthor_BookId_AuthorId" ON "BookAuthor"`);
    await queryRunner.query(`DROP TABLE "BookAuthor"`);

    await queryRunner.query(`DROP TABLE "Authors"`);

    await queryRunner.query(`DROP INDEX "IDX_BOOK_TITLE" ON "Books"`);
    await queryRunner.query(`DROP INDEX "IDX_BOOK_ISBN" ON "Books"`);
    await queryRunner.query(`DROP TABLE "Books"`);

    await queryRunner.query(`DROP INDEX "IDX_USER_USERNAME" ON "Users"`);
    await queryRunner.query(`DROP TABLE "Users"`);

    await queryRunner.query(`DROP INDEX "IDX_UserRole_UserId_RoleId" ON "UserRole"`);
    await queryRunner.query(`DROP TABLE "UserRole"`);

    await queryRunner.query(`DROP INDEX "IDX_ROLE_NAME" ON "Roles"`);
    await queryRunner.query(`DROP TABLE "Roles"`);
  }
}
