import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { userInfo } from 'os';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
  async validateTokenAndGetUserData(token: string): Promise<{ valid: boolean, user?: any }> {
    try {
      const decoded = this.jwtService.verify(token);
      console.log(decoded); // This should log the full payload including username
      const user = await this.usersService.findOne(decoded.username);
      if (!user) {
        return { valid: false };
      }
      return { valid: true, user };
    } catch (error) {
      return { valid: false };
    }
  }

  async login(user: any) {
    console.log(user)
    const payload = { username: user._doc.username, sub: user._doc._id ,status:user._doc.status };
    console.log(payload)
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
  async checkUserExists(studentId: string): Promise<boolean> {
    const user = await this.usersService.findOne(studentId);
    return !!user;
  }
// In auth.service.ts
async register(username: string, password: string, fullName: string) {
  try {
    const user = await this.usersService.create(username, password, fullName);
    return {
      status: true,
      message: "Register success",
    };
  } catch (error) {
    if (error.code === 11000) { 
      return {
        status: false,
        message: "Username already exists",
      };
    }
    throw error;
  }
}
  async book(studentId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findOne(studentId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
  
    if (user.status !== 'wait') {
      return { success: false, message: 'User status is not waiting' };
    }
  
    user.status = 'pending';
    await user.save();
  
    return { success: true, message: 'User status updated to pending' };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const decoded = this.jwtService.verify(token);
      return !!decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}