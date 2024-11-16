import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  RequestTimeoutException, 
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { KbizService } from './kbiz.service';
import { AuthService } from 'src/auth/auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
@Controller('api')
export class KBizController {
  constructor(
    private readonly kBizService: KbizService,
    private readonly authService: AuthService,
  ) {}

  @Post('check-transaction')
  async checkTransaction(
    @Body('amountTransaction') amountTransaction: number
  ) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new RequestTimeoutException('Request timeout'));
        }, 30000);
      });

      const transactionPromise = (async () => {
        const transactionList = await this.kBizService.getTransactionList(amountTransaction);
        return { success: true, transactions: transactionList };
      })();

      return await Promise.race([transactionPromise, timeoutPromise]);

    } catch (error) {
      if (error instanceof RequestTimeoutException) {
        await this.kBizService.resetSession();
        return {
          success: false,
          message: 'Request timed out. System has been reset.',
          error: 'TIMEOUT'
        };
      }

      await this.kBizService.resetSession();
      return {
        success: false,
        message: 'An error occurred',
        error: error.message
      };
    }
  }

  @Get('check-balance')
  async checkBalance() {
    try {
      const userInfo = await this.kBizService.getBalance();
      if (!userInfo) {
        return { success: false, message: 'Account error!' };
      }
      return { 
        success: true, 
        balance: userInfo['accountSummaryList'][0]['acctBalance'] 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed to fetch balance',
        error: error.message 
      };
    }
  }

  @Post('verify')
  async verifySlip(@Body() body: { data: string; packaged: string; token: string }) {
    try {
      // Check token first
      if (!body.token) {
        return {
          success: false,
          message: 'Token is required'
        };
      }
      let amount: number;
      console.log(body.packaged)
      switch (body.packaged) {
        case 'basic':
          amount = 99;
          break;
        case 'package_129':
          amount = 129;
          break;
        case 'shirt_289_S':
          amount = 289;
          break;
        case 'shirt_289_M':
          amount = 289;
          break;
        case 'shirt_289_L':
          amount = 289;
          break;
        case 'shirt_289_XL':
          amount = 289;
          break;
        case 'shirt_339_2XL':
          amount = 339;
          break;
        case 'shirt_339_3XL':
          amount = 339;
          break;
        case 'shirt_339_4XL':
          amount = 339;
          break;

        default:
          return {
            success: false,
            message: 'Invalid package type'
          };
      }

      const userData = await this.authService.validateTokenAndGetUserData(body.token);
      
      if (!userData.valid || !userData.user) {
        return {
          success: false,
          message: 'Invalid token or user not found'
        };
      }
      
      const result = await this.kBizService.verifySlip(body.data, amount.toString());

      if(result) {
        const user = userData.user;
        user.status = `${body.packaged}`;
        user.ticket = true;
        await user.save();

        return { success: true,data: result,message: 'Payment verified and user status updated'};
      }
      
      return {
        success: false,
        message: 'Verification failed'
      };
  
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Verification failed',
      };
    }
  }
}