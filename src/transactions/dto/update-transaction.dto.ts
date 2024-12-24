import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsNotEmpty,
  IsDate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateTransactionDto {
  @ApiProperty({
    description:
      'Unique identifier of the budget to which the transaction belongs.',
    example: 'b2c6e182-6aef-4c38-8d26-9153d7ebc7d2',
  })
  @IsNotEmpty()
  @IsUUID()
  budget_id: string;

  @ApiPropertyOptional({
    description:
      'New amount for the transaction. Must be a positive number with up to two decimal places.',
    example: 150.75,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'The amount must be greater than 0.' })
  amount?: number;

  @ApiPropertyOptional({
    description: 'New date for the transaction in ISO 8601 format.',
    example: '2024-12-04T12:34:56Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @ApiPropertyOptional({
    description: 'New description for the transaction.',
    example: 'Updated description for grocery shopping',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
