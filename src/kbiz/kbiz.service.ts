import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KBiz from './Kbiz';
import axios from 'axios';

@Injectable()
export class KbizService {
  private kBizClient: KBiz;

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient() {
    const config = {
      username: this.configService.get<string>('USERNAME'),
      password: this.configService.get<string>('PASSWORD'),
      bankAccountNumber: this.configService.get<string>('BANK_ACCOUNT_NUMBER'),
    };
    this.kBizClient = new KBiz(config);
  }

  async resetSession() {
    try {
      this.initializeClient();
      await this.kBizClient.initializeSession();
    } catch (error) {
      throw new HttpException(
        'Failed to reset session',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async executeWithErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      await this.resetSession();
      throw new HttpException(
        error.message || 'Operation failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async getBalance() {
    return this.executeWithErrorHandling(async () => {
      const userInfo = await this.kBizClient.initializeSession();
      return userInfo;
    });
  }
  async verifySlip(data: string, amount: string) {
    try {
      const response = await axios.post(
        'https://api.slipok.com/api/line/apikey/34026',
        {
          data,
          amount,
          log: true,
        },
        {
          headers: {
            'x-authorization': 'SLIPOKEIGKOKV',
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Verification failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getTransactionList(limitRow: number) {
    return this.executeWithErrorHandling(async () => {
      return await this.kBizClient.getTransactionList(limitRow);
    });
  }

  async processData(data: any) {
    return this.executeWithErrorHandling(async () => {
      const formattedData = {
        dataRsso: JSON.stringify(data),
        status: data.status,
        serviceName: data.serviceName
      };

      const encodedData = this.formUrlEncoded(formattedData);
      
      const response = await axios.post('/your-endpoint', encodedData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    });
  }

  private formUrlEncoded(obj: Record<string, any>): string {
    return Object.entries(obj)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }
}