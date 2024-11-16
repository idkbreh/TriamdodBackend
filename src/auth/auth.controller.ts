import { Controller, Request, Post, UseGuards, Body,UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { CsvService } from 'src/csv/csv.service';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService,private csvService: CsvService,) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
  @Post('status')
  async getUsername(@Body('token') token: string) {
    try {
      const result = await this.authService.validateTokenAndGetUserData(token);
      if (!result.valid || !result.user) {
        throw new UnauthorizedException('Invalid token or user not found');
      }
      return { studentid: result.user.username ,status:result.user.status};
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

//   @Post('booking')
//   async book(@Body() body: { studentId: string }) {
//   const { studentId } = body;
//   return this.authService.book(studentId);
// }

@Post('register')
async register(@Body() body: { studentId: string, password: string, password2: string, birthdate: string }) {
  const { studentId, password, password2, birthdate } = body;

  if (password !== password2) {
    return { success: false, message: 'Passwords do not match' };
  }

  const student = this.csvService.findStudent(studentId, birthdate);
  if (!student) {
    return { success: false, message: 'Student ID or birthdate not found in CSV' };
  }

  const userExists = await this.authService.checkUserExists(studentId);
  if (userExists) {
    return { success: false, message: 'Student ID already registered' };
  }

  const fullName = `${student.firstname} ${student.secondname}`;
  return this.authService.register(studentId, password, fullName);
}

  @Post('check-status')
  @ApiOperation({ summary: 'Check user status by token' })
  @ApiBody({ schema: { example: { token: 'your_jwt_token' } } })
  @ApiResponse({ status: 200, description: 'User status', schema: { example: { status: 'active' } } })
  async checkStatus(@Body('token') token: string): Promise<{ status: string }> {
    try {
      const result = await this.authService.validateTokenAndGetUserData(token);
      if (!result.valid || !result.user) {
        throw new UnauthorizedException('Invalid token or user not found');
      }
      return { status: result.user.status };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
  @Post('token')
  @ApiOperation({ summary: 'Check if token is valid and return user data' })
  @ApiBody({ schema: { example: { token: 'your_jwt_token' } } })
  @ApiResponse({ status: 200, description: 'Token validation result with user data', schema: { example: { valid: true, user: { username: 'john_doe', status: 'active', ticket: true } } } })
  async checkToken(@Body() body: { token: string }): Promise<{ valid: boolean, user?: { username: string, status: string, ticket: boolean } }> {
    const result = await this.authService.validateToken(body.token);
    return {valid:result};
  }
}