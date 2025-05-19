import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createMock } from '@golevelup/ts-jest';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    appController = createMock<AppController>({
      getHello: () => 'Hello World!',
    });
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
