import { Test, TestingModule } from '@nestjs/testing';
import { CrispService } from './crisp.service';

describe('CrispService', () => {
  let service: CrispService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrispService],
    }).compile();

    service = module.get<CrispService>(CrispService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
