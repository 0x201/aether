import { MigrationInterface, QueryRunner } from 'typeorm'

export class Initial1768976357914 implements MigrationInterface {
  name = 'Initial1768976357914'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "bookstore"."menus" ("created_time" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(200) NOT NULL DEFAULT '', "last_modified_time" TIMESTAMP WITH TIME ZONE DEFAULT now(), "last_modified_by" character varying(200), "id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "title" character varying(100) NOT NULL, "icon" character varying, "route" character varying, "order" integer NOT NULL, "parent_id" integer, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "menus_pk" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "bookstore"."role_menu" ("id" SERIAL NOT NULL, "menu_id" integer NOT NULL, "role_id" integer NOT NULL, "assigned_at" character varying NOT NULL, "assigned_by" character varying(100), CONSTRAINT "role_menu_pk" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "role_menu_role_id_menu_id_idx" ON "bookstore"."role_menu" ("menu_id", "role_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "bookstore"."roles" ("created_time" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(200) NOT NULL DEFAULT '', "last_modified_time" TIMESTAMP WITH TIME ZONE DEFAULT now(), "last_modified_by" character varying(200), "id" SERIAL NOT NULL, "name" character varying(200) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "roles_pk" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE UNIQUE INDEX "roles_name_idx" ON "bookstore"."roles" ("name") `)
    await queryRunner.query(
      `CREATE TABLE "bookstore"."authors" ("created_time" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(200) NOT NULL DEFAULT '', "last_modified_time" TIMESTAMP WITH TIME ZONE DEFAULT now(), "last_modified_by" character varying(200), "id" SERIAL NOT NULL, "first_name" character varying(50) NOT NULL, "last_name" character varying(50) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "authors_pk" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "bookstore"."book_author" ("id" SERIAL NOT NULL, "book_id" integer NOT NULL, "author_id" integer NOT NULL, CONSTRAINT "book_author_pk" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "book_author_book_id_author_id_idx" ON "bookstore"."book_author" ("book_id", "author_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "bookstore"."books" ("created_time" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(200) NOT NULL DEFAULT '', "last_modified_time" TIMESTAMP WITH TIME ZONE DEFAULT now(), "last_modified_by" character varying(200), "id" SERIAL NOT NULL, "title" character varying(512) NOT NULL, "price" numeric(18,2) NOT NULL, "isbn" character varying(16) NOT NULL, "description" character varying(2048), "publish_date" character varying(10), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "books_pk" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE UNIQUE INDEX "books_isbn_idx" ON "bookstore"."books" ("isbn") `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "books_title_idx" ON "bookstore"."books" ("title") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "bookstore"."books_title_idx"`)
    await queryRunner.query(`DROP INDEX "bookstore"."books_isbn_idx"`)
    await queryRunner.query(`DROP TABLE "bookstore"."books"`)
    await queryRunner.query(`DROP INDEX "bookstore"."book_author_book_id_author_id_idx"`)
    await queryRunner.query(`DROP TABLE "bookstore"."book_author"`)
    await queryRunner.query(`DROP TABLE "bookstore"."authors"`)
    await queryRunner.query(`DROP INDEX "bookstore"."roles_name_idx"`)
    await queryRunner.query(`DROP TABLE "bookstore"."roles"`)
    await queryRunner.query(`DROP INDEX "bookstore"."role_menu_role_id_menu_id_idx"`)
    await queryRunner.query(`DROP TABLE "bookstore"."role_menu"`)
    await queryRunner.query(`DROP TABLE "bookstore"."menus"`)
  }
}
