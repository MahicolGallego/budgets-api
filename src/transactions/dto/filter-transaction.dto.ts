import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class FilterTransactionDto {
  @ApiPropertyOptional({
    description: 'Filter budgets by minimun day',
    example: '3',
    minimum: 1,
    maximum: 31,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Min day must be at least 0.' })
  @Max(31, { message: 'Max day must be no more than 31.' })
  min_day?: number;

  @ApiPropertyOptional({
    description: 'Filter budgets by maximun',
    example: '3',
    minimum: 1,
    maximum: 31,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Min day must be at least 0.' })
  @Max(31, { message: 'Max day must be no more than 31.' })
  max_day?: number;

  @ApiPropertyOptional({
    description: 'Filter transactions by minimum amount',
    example: '0.01',
    minimum: 0.01, // Establecemos que el mínimo es 0.01
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Min amount must be at least 0.01.' })
  min_amount?: number;

  @ApiPropertyOptional({
    description: 'Filter transactions by maximum amount',
    example: '1000',
    minimum: 0.01,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Max amount must be at least 0.01.' })
  max_amount?: number;
}
