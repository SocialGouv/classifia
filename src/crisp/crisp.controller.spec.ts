import { Test, TestingModule } from '@nestjs/testing';
import { CrispController } from './crisp.controller';
import { CrispService } from './crisp.service';

describe('CrispController', () => {
  let controller: CrispController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrispController],
      providers: [CrispService],
    }).compile();

    controller = module.get<CrispController>(CrispController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
