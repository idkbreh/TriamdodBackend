import { Test, TestingModule } from '@nestjs/testing';
import { KbizService } from './kbiz.service';

describe('KbizService', () => {
  let service: KbizService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KbizService],
    }).compile();

    service = module.get<KbizService>(KbizService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
