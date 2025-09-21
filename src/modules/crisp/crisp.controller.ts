import { Controller } from '@nestjs/common';
import { CrispService } from './crisp.service';

@Controller('crisp')
export class CrispController {
  constructor(private readonly crispService: CrispService) {}
}
