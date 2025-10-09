import { Injectable, Logger } from '@nestjs/common';
import { CreateBookCommand } from '../books/commands/create-book.command';
import { BooksService } from '../books/books.service';
import { AuthorsService } from '../authors/authors.service';
import { RolesService } from '../roles/roles.service';
import { MenusService } from '../menus/menus.service';
import { CreateMenuCommand } from 'src/menus/commands/create-menu.command';

@Injectable()
export class DataSeedService {
  private readonly logger = new Logger(DataSeedService.name);
  private static readonly AUTHORS_TO_SEED = [
    { firstName: 'Stephen', lastName: 'Hawking' },
    { firstName: 'Eric', lastName: 'Matthes' },
    { firstName: 'Alex', lastName: 'Xu' },
    { firstName: 'Nick', lastName: 'Morgan' },
    { firstName: 'Aditya Y', lastName: 'Bhargava' },
  ];

  private static readonly BOOKS_TO_SEED: CreateBookCommand[] = [
    {
      title: 'A Brief History of Time',
      isbn: '978-0553380163',
      description:
        'A landmark volume in science writing by one of the great minds of our time, Stephen Hawking\'s book explores such profound questions as: How did the universe begin—and what made its start possible? Does time always flow forward? Is the universe unending—or are there boundaries? Are there other dimensions in space? What will happen when it all ends?\\nTold in language we all can understand, A Brief History of Time plunges into the exotic realms of black holes and quarks, of antimatter and "arrows of time," of the big bang and a bigger God—where the possibilities are wondrous and unexpected. With exciting images and profound imagination, Stephen Hawking brings us closer to the ultimate secrets at the very heart of creation.',
      publishDate: '1998-09-01',
      price: 9.99,
      authors: [{ id: 1, firstName: 'Eric', lastName: 'Matthes', isActive: true }],
    },
    {
      title:
        'Python Crash Course, 3rd Edition: A Hands-On, Project-Based Introduction to Programming',
      isbn: '978-1718502703',
      description:
        "Python Crash Course is the world's bestselling programming book, with over 1,500,000 copies sold to date!\\nPython Crash Course is the world's best-selling guide to the Python programming language. This fast-paced, thorough introduction will have you writing programs, solving problems, and developing functioning applications in no time.\\nYou'll start by learning basic programming concepts, such as variables, lists, classes, and loops, and practice writing clean code with exercises for each topic. You'll also learn how to make your programs interactive and test your code safely before adding it to a project. You'll put your new knowledge into practice by creating a Space Invaders-inspired arcade game, building a set of data visualizations with Python's handy libraries, and deploying a simple application online.",
      publishDate: '2023-01-10',
      price: 31.99,
      authors: [{ id: 2, firstName: 'Jay', lastName: 'Wengler', isActive: true }],
    },
    {
      title: "System Design Interview - An insider's guide",
      isbn: '979-8664653403',
      description:
        "System Design Interview - An Insider's Guide (Volume 1)\\nSystem design interviews are the most difficult to tackle of all technical interview questions. This book is Volume 1 of the System Design Interview - An insider's guide series that provides a reliable strategy and knowledge base for approaching a broad range of system design questions. This book provides a step-by-step framework for how to tackle a system design question. It includes many real-world examples to illustrate the systematic approach, with detailed steps that you can follow.",
      publishDate: '2024-03-05',
      price: 37.99,
      authors: [{ id: 3, firstName: 'Jane', lastName: 'Doe', isActive: true }],
    },
    {
      title:
        'JavaScript Crash Course: A Hands-On, Project-Based Introduction to Programming',
      isbn: '978-1718502260',
      description:
        'A fast-paced, thorough programming introduction that will have you writing your own software and web applications in no time.\\nLike Python Crash Course, this hands-on guide is a must-have for anyone who wants to learn how to code from the ground up—this time using the popular JavaScript programming language.\\nLearn JavaScript—Fast!',
      publishDate: '2024-03-05',
      price: 39.58,
      authors: [{ id: 4, firstName: 'Ari', lastName: 'Elsas', isActive: true }],
    },
    {
      title: 'Grokking Algorithms, Second Edition',
      isbn: '978-1633438538',
      description:
        "A friendly, fully-illustrated introduction to the most important computer programming algorithms.\\nMaster the most widely used algorithms and be fully prepared when you're asked about them at your next job interview. With beautifully simple explanations, over 400 fun illustrations, and dozens of relevant examples, you'll actually enjoy learning about algorithms with this fun and friendly guide!",
      publishDate: '2024-03-26',
      price: 47.49,
      authors: [{ id: 5, firstName: 'J.K.', lastName: 'Rowling', isActive: true }],
    },
  ];

  constructor(
    private readonly rolesService: RolesService,
    private readonly booksService: BooksService,
    private readonly authorsService: AuthorsService,
    private readonly menusService: MenusService,
  ) { }

  private async seedBooksAndAuthors(): Promise<void> {
    try {
      const [authorCount, bookCount] = await Promise.all([
        this.authorsService.count(),
        this.booksService.count(),
      ]);

      if (authorCount > 0) {
        this.logger.log('Author is already setup. Skip seeding');
      } else {
        this.logger.log('Seeding author data - Start');
        await this.authorsService.insertMany(DataSeedService.AUTHORS_TO_SEED);
        this.logger.log('Seeding author data - End');
      }

      if (bookCount > 0) {
        this.logger.log('Book is already setup, Skip seeding');
      } else {
        this.logger.log('Seeding book data - Start');
        await this.booksService.insertMany(DataSeedService.BOOKS_TO_SEED);
        this.logger.log('Seeding book data - End');
      }
    } catch (error) {
      this.logger.error('Error during seeding:', error);
      throw error;
    }
  }

  private async seedRoles() {
    const roleCount = await this.rolesService.count();
    if (roleCount > 0) {
      this.logger.log('Role is already setup, Skip seeding');
    } else {
      this.logger.log('Seeding role data - Start');
      await this.rolesService.insertMany([
        { name: 'admin' },
        { name: 'moderator' },
        { name: 'user' },
      ]);
      this.logger.log('Seeding role data - End');
    }
  }

  private async seedMenus() {
    const menuCount = await this.menusService.count();
    if (menuCount > 0) {
      this.logger.log('Menus are already setup, Skip seeding');
      return;
    }

    this.logger.log('Seeding menu data - Start');

    const roles = await this.rolesService.findAllRoles();
    const adminRole = roles.find((r) => r.name === 'admin');
    const userRole = roles.find((r) => r.name === 'user');

    const menus: CreateMenuCommand[] = [
      {
        name: 'home',
        title: 'Home',
        icon: 'home',
        route: '/home',
        order: 1,
        parentId: 0,
        roles: (adminRole && userRole) ? [userRole, adminRole] : [],
      },
      {
        name: 'browse_books',
        title: 'Browse Books',
        icon: 'menu_book',
        route: '/books',
        order: 2,
        parentId: 0,
        roles: (adminRole && userRole) ? [userRole, adminRole] : [],
      },
      {
        name: 'book_management',
        title: 'Book Management',
        icon: 'library_books',
        route: '/books/management',
        order: 3,
        parentId: 0,
        roles: adminRole ? [adminRole] : [],
      },
      {
        name: 'menu_management',
        title: 'Menu Management',
        icon: 'menu_book',
        route: '/menus/management',
        order: 4,
        parentId: 0,
        roles: adminRole ? [adminRole] : [],
      },
    ];

    await this.menusService.insertMany(menus);

    this.logger.log('Seeding menu data - End');
  }

  async seedAsync() {
    this.logger.log('Starting data seeding...');
    try {
      await this.seedBooksAndAuthors();
      await this.seedRoles();
      await this.seedMenus();
      this.logger.log('Data seeding completed successfully.');
    } catch (error) {
      this.logger.error('Error during data seeding:', error);
      throw error;
    }
  }
}