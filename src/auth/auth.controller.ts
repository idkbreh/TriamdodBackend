import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ schema: { example: { username: 'user1', password: 'password1' } } })
  @ApiResponse({ status: 201, description: 'Successful login' })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  @ApiBody({ schema: { example: { username: 'user1', password: 'password1' } } })
  @ApiResponse({ status: 201, description: 'Successful registration' })
  async register(@Body() body: { username: string, password: string }) {
    const { username, password } = body;
    return this.authService.register(username, password);
  }

  @Post('token')
  @ApiOperation({ summary: 'Check if token is valid' })
  @ApiBody({ schema: { example: { token: 'your_jwt_token' } } })
  @ApiResponse({ status: 200, description: 'Token validation result', schema: { example: { valid: true } } })
  async checkToken(@Body() body: { token: string }): Promise<{ valid: boolean }> {
    const isValid = await this.authService.validateToken(body.token); // รับค่าเข้าไปละทำการ execute function ที่อยู่ใน Class authService
    return { valid: isValid };
  }
}