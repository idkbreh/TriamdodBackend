import { Test, TestingModule } from '@nestjs/testing';
import { KBizController } from './kbiz.controller';

describe('KbizController', () => {
  let controller: KBizController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KBizController],
    }).compile();

    controller = module.get<KBizController>(KBizController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
