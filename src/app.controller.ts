import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Check API status' })
  @ApiResponse({ status: 200, description: 'API works properly', type: String })
  getApiStatus(): string {
    return 'API works properly';
  }
}