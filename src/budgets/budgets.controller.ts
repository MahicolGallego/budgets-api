import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Request } from 'express';
import { Budget } from './entities/budget.entity';
import { IPayloadToken } from 'src/common/interfaces/payload-token.interface';
import { FilterBudgetDto } from './dto/filter-budget.dto';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@ApiTags('Budgets')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(@Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetsService.create(createBudgetDto);
  }

  @Get()
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter budgets by category name.',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Filter budgets by month 0 - 11(0 = January, 11 = December).',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter budgets by their status.(pending, active, completed)',
  })
  @ApiOkResponse({
    description: 'Budgets retrieved successfully.',
    type: [Budget],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  async findAll(
    @Req() req: Request,
    @Query() filterOptions: FilterBudgetDto,
  ): Promise<Budget[]> {
    const user = req.user as IPayloadToken;
    return await this.budgetsService.findAll(user.sub, filterOptions);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the budget (UUID).',
    required: true,
    example: 'b2c6e182-6aef-4c38-8d26-9153d7ebc7d2',
  })
  @ApiOkResponse({
    description: 'Budget retrieved successfully.',
    type: Budget,
  })
  @ApiNotFoundResponse({ description: 'Budget not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<Budget> {
    const user = req.user as IPayloadToken;
    return await this.budgetsService.findOne(id, user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBudgetDto: UpdateBudgetDto) {
    return this.budgetsService.update(+id, updateBudgetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.budgetsService.remove(+id);
  }
}
