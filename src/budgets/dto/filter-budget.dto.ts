import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { budgetStatus } from 'src/common/constants/enums/budget-status.enum';

export class FilterBudgetDto {
  @ApiPropertyOptional({
    description: 'Category name to filter budgets.',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description:
      'Filter budgets by month. Represented as a number (0 = January, 11 = December).',
    example: '3',
    minimum: 0,
    maximum: 11,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Month must be a valid number.' })
  @Min(0, { message: 'Month must be at least 0 (January).' })
  @Max(11, { message: 'The month must be no more than 11 (December).' })
  month?: number;

  @ApiPropertyOptional({
    description: 'Filter budgets by their status.',
    example: budgetStatus.ACTIVE,
    enum: budgetStatus,
  })
  @IsOptional()
  @IsEnum(budgetStatus)
  status?: budgetStatus;
}
