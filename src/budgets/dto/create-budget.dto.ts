import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty({
    description: 'Name of the budget.',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Name of the category the budget belongs to.',
  })
  @IsNotEmpty()
  @IsString()
  category_name: string;

  @ApiProperty({
    description: 'Amount assigned for the budget. Must be a positive number.',
    example: 500.75,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description:
      'Month for which the budget is created. Represented as a number (0 = January, 11 = December).',
    minimum: 0,
    maximum: 11,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Month must be at least 0 (January).' })
  @Max(11, { message: 'The month must be no more than 11 (December).' })
  month: number;
}
