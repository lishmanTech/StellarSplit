import { Test, TestingModule } from '@nestjs/testing';
import { SplitCommentsController } from './split-comments.controller';

describe('SplitCommentsController', () => {
  let controller: SplitCommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SplitCommentsController],
    }).compile();

    controller = module.get<SplitCommentsController>(SplitCommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
