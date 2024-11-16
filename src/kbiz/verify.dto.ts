import { IsNumber, IsOptional } from 'class-validator';

export class VerifyDto {
  @IsOptional()
  @IsNumber()
  amount?: number;
}