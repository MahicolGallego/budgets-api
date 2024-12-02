import { Type } from 'class-transformer';
import {
  IsUUID,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  budget_id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'The amount must be greater than 0.' })
  amount: number;

  @IsDateString()
  @Type(() => Date)
  date: string;

  @IsOptional()
  @IsString()
  description?: string;
}
