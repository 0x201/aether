import { Injectable } from '@nestjs/common';
import { CreateBookCommand } from 'src/books/commands/create-book.command';
import { genSalt, hash } from 'bcrypt';
import { UserConstants } from 'src/users/constants';
import { BooksService } from 'src/books/books.service';
import { AuthorsService } from 'src/authors/authors.service';
import { UsersService } from 'src/users/users.service';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class DataSeedService {
  constructor(
    private readonly usersServie: UsersService,
    private readonly rolesService: RolesService,
    private readonly booksService: BooksService,
    private readonly authorsService: AuthorsService) { }


  async seedAsync(): Promise<void> {
    await Promise.all([
      await this.setupBooksAndAuthors(),
      await this.setupUsersAndRoles()
    ]);
  }

  private async setupBooksAndAuthors(): Promise<void> {
    const authorExistingCount = await this.authorsService.count();
    if (authorExistingCount > 0) {
      console.log("Author is already setup. Skip seeding");
      return;
    }
    console.log("Seeding author data - Start");
    await this.authorsService.createMany([
      { firstName: "Stephen", lastName: "Hawking" },
      { firstName: "Eric", lastName: "Matthes" },
      { firstName: "Alex", lastName: "Xu" },
      { firstName: "Nick", lastName: "Morgan" },
      { firstName: "Aditya Y", lastName: "Bhargava" },
    ]);
    console.log("Seeding author data - End");

    const bookExistingCount = await this.booksService.count();
    if (bookExistingCount > 0) {
      console.log("Book is already setup, Skip seeding");
      return;
    }
    console.log("Seeding book data - Start");
    const createBookCommands: CreateBookCommand[] = [
      { title: "A Brief History of Time", isbn: "978-0553380163", description: "A landmark volume in science writing by one of the great minds of our time, Stephen Hawking's book explores such profound questions as: How did the universe begin—and what made its start possible? Does time always flow forward? Is the universe unending—or are there boundaries? Are there other dimensions in space? What will happen when it all ends?\nTold in language we all can understand, A Brief History of Time plunges into the exotic realms of black holes and quarks, of antimatter and “arrows of time,” of the big bang and a bigger God—where the possibilities are wondrous and unexpected. With exciting images and profound imagination, Stephen Hawking brings us closer to the ultimate secrets at the very heart of creation.", publishDate: "1998-09-01", price: 9.99, authorIds: [1] },
      { title: "Python Crash Course, 3rd Edition: A Hands-On, Project-Based Introduction to Programming", isbn: "978-1718502703", description: "ython Crash Course is the world's bestselling programming book, with over 1,500,000 copies sold to date!\nPython Crash Course is the world's best-selling guide to the Python programming language. This fast-paced, thorough introduction will have you writing programs, solving problems, and developing functioning applications in no time.\nYou'll start by learning basic programming concepts, such as variables, lists, classes, and loops, and practice writing clean code with exercises for each topic. You'll also learn how to make your programs interactive and test your code safely before adding it to a project. You'll put your new knowledge into practice by creating a Space Invaders-inspired arcade game, building a set of data visualizations with Python's handy libraries, and deploying a simple application online.", publishDate: "2023-01-10", price: 31.99, authorIds: [2] },
      { title: "System Design Interview - An insider's guide", isbn: "979-8664653403", description: "System Design Interview - An Insider's Guide (Volume 1)\nSystem design interviews are the most difficult to tackle of all technical interview questions. This book is Volume 1 of the System Design Interview - An insider's guide series that provides a reliable strategy and knowledge base for approaching a broad range of system design questions. This book provides a step-by-step framework for how to tackle a system design question. It includes many real-world examples to illustrate the systematic approach, with detailed steps that you can follow.", publishDate: "2024-03-05", price: 37.99, authorIds: [3] },
      { title: "JavaScript Crash Course: A Hands-On, Project-Based Introduction to Programming", isbn: "978-1718502260", description: "A fast-paced, thorough programming introduction that will have you writing your own software and web applications in no time.\nLike Python Crash Course, this hands-on guide is a must-have for anyone who wants to learn how to code from the ground up—this time using the popular JavaScript programming language.\nLearn JavaScript—Fast!", publishDate: "2024-03-05", price: 39.58, authorIds: [4] },
      { title: "Grokking Algorithms, Second Edition", isbn: "978-1633438538", description: "A friendly, fully-illustrated introduction to the most important computer programming algorithms.\nMaster the most widely used algorithms and be fully prepared when you're asked about them at your next job interview. With beautifully simple explanations, over 400 fun illustrations, and dozens of relevant examples, you'll actually enjoy learning about algorithms with this fun and friendly guide!", publishDate: "2024-03-26", price: 47.49, authorIds: [5] },
    ];
    await this.booksService.createMany(createBookCommands);
    console.log("Seeding book data - End");
  }

  private async setupUsersAndRoles() {
    const roleCount = await this.rolesService.count();
    if (roleCount > 0) {
      console.log("Role is already setup, Skip seeding");
    } else {
      console.log("Seeding role data - Start");
      await this.rolesService.insertMany([
        { name: 'admin' },
        { name: 'moderator' },
        { name: 'user' }
      ]);
      console.log("Seeding role data - End");
    }

    const userCount = await this.usersServie.count();
    if (userCount > 0) {
      console.log("User is already setup, Skip seeding");
      return;
    } else {
      console.log("Seeding user data - Start");
      const salt = await genSalt(UserConstants.saltRound);
      await this.usersServie.insert({
        username: 'admin',
        password: await hash('1q2w3E!', salt),
        nickname: 'admin',
        roles: ['admin'],
      });
      console.log("Seeding user data - End");
    }
  }

}

