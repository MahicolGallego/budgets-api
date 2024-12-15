import { Type } from 'class-transformer';
import {
  IsUUID,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({
    description:
      'Unique identifier of the budget to which the transaction belongs.',
    example: 'b2c6e182-6aef-4c38-8d26-9153d7ebc7d2',
  })
  @IsUUID()
  budget_id: string;

  @ApiProperty({
    description:
      'Amount of the transaction. Must be a positive number with up to two decimal places.',
    example: 100.5,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'The amount must be greater than 0.' })
  amount: number;

  @ApiProperty({
    description: 'Date of the transaction in ISO 8601 format.',
    example: '2024-12-04T12:34:56Z',
  })
  @IsDateString()
  @Type(() => Date)
  date: Date;

  @ApiProperty({
    description: 'Optional description of the transaction.',
    example: 'Grocery shopping',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
