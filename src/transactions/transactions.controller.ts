import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBody,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { IPayloadToken } from 'src/common/interfaces/payload-token.interface';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt-auth.guard';
import { FilterTransactionDto } from './dto/filter-transaction.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new transaction for a budget.',
    description:
      'This endpoint allows the creation of a new transaction tied to a specific budget. The budget must be active and belong to the authenticated user.',
  })
  @ApiBody({
    description: 'Payload for creating a new transaction.',
    type: CreateTransactionDto,
    examples: {
      example1: {
        summary: 'Valid request',
        description:
          'Example of a valid request to create a transaction. description is optional',
        value: {
          budget_id: 'b2c6e182-6aef-4c38-8d26-9153d7ebc7d2',
          amount: 200.5,
          date: '2024-12-04T14:00:00Z',
          description: 'Grocery shopping',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'The transaction has been successfully created.',
    type: Transaction,
  })
  @ApiBadRequestResponse({
    description:
      'Validation error or business logic error (e.g., amount must be greater than 0).',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated.',
  })
  create(
    @Req() req: Request,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const user = req.user as IPayloadToken;
    return this.transactionsService.create(user.sub, createTransactionDto);
  }

  @Get('budget/:budget_id')
  @ApiOperation({
    summary: 'Retrieve transactions for a budget with optional filters.',
    description:
      'Fetch all transactions associated with a specific budget, with optional filters for date range and transaction amount.',
  })
  @ApiParam({
    name: 'budget_id',
    description:
      'Unique identifier for the budget to which the transactions belong',
    type: 'string',
    example: 'b2c6e182-6aef-4c38-8d26-9153d7ebc7d2',
  })
  @ApiQuery({
    name: 'min_day',
    required: false,
    type: 'number',
    description: 'Filter transactions by the minimum day of the month.',
    example: 1,
  })
  @ApiQuery({
    name: 'max_day',
    required: false,
    type: 'number',
    description: 'Filter transactions by the maximum day of the month.',
    example: 31,
  })
  @ApiQuery({
    name: 'min_amount',
    required: false,
    type: 'number',
    description: 'Filter transactions by the minimum amount.',
    example: 0.01,
  })
  @ApiQuery({
    name: 'max_amount',
    required: false,
    type: 'number',
    description: 'Filter transactions by the maximum amount.',
    example: 1000,
  })
  @ApiOkResponse({
    description:
      'Returns the list of transactions that match the filter criteria.',
    type: [Transaction],
  })
  @ApiBadRequestResponse({
    description: 'Invalid parameters or business logic error.',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated.',
  })
  findAll(
    @Req() req: Request,
    @Param('budget_id', ParseUUIDPipe) budget_id: string,
    @Query() filterOptions: FilterTransactionDto,
  ) {
    const user = req.user as IPayloadToken;
    return this.transactionsService.findAll(budget_id, user.sub, filterOptions);
  }

  @Get(':id/budget/:budget_id')
  @ApiOperation({
    summary: 'Retrieve a specific transaction by ID and its budget.',
    description:
      'Fetches a specific transaction that matches the given ID and budget. Ensures the transaction belongs to the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the transaction.',
    type: 'string',
    example: 'trans-1234',
  })
  @ApiParam({
    name: 'budget_id',
    description:
      'Unique identifier for the budget to which the transaction belong',
    type: 'string',
    example: 'b2c6e182-6aef-4c38-8d26-9153d7ebc7d2',
  })
  @ApiOkResponse({
    description: 'Returns the details of the transaction.',
    type: Transaction,
  })
  @ApiNotFoundResponse({
    description: 'Transaction not found or does not belong to the budget.',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated.',
  })
  findOne(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('budget_id', ParseUUIDPipe) budget_id: string,
  ) {
    const user = req.user as IPayloadToken;
    return this.transactionsService.findOne(id, budget_id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a transaction.',
    description:
      'Updates an existing transaction identified by its ID. Validates that the transaction belongs to the authenticated user and the associated budget is active.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the transaction.',
    type: 'string',
    example: 'trans-1234',
  })
  @ApiBody({
    description: 'Payload for updating a transaction.',
    type: UpdateTransactionDto,
  })
  @ApiOkResponse({
    description: 'Transaction updated successfully.',
    schema: {
      example: {
        id: 'trans-1234',
        budget_id: 'b2c6e182-6aef-4c38-8d26-9153d7ebc7d2',
        amount: 150.75,
        date: '2024-12-04T12:34:56Z',
        description: 'Updated description for grocery shopping',
      },
    },
  })
  @ApiNotFoundResponse({
    description:
      'Transaction or associated budget not found or budget currently is not active.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request parameters or data.',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated.',
  })
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    const user = req.user as IPayloadToken;
    return this.transactionsService.update(id, user.sub, updateTransactionDto);
  }

  @Delete(':id/budget/:budget_id')
  @ApiOperation({
    summary: 'Delete a transaction.',
    description:
      'Deletes a specific transaction identified by its ID and budget ID. The budget must be active and belong to the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the transaction.',
    type: 'string',
    example: 'trans-1234',
  })
  @ApiParam({
    name: 'budget_id',
    description:
      'Unique identifier for the budget to which the transaction belong',
    type: 'string',
    example: 'b2c6e182-6aef-4c38-8d26-9153d7ebc7d2',
  })
  @ApiOkResponse({
    description: 'Transaction deleted successfully.',
    schema: {
      example: { message: 'Transaction deleted successfully' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Transaction or associated budget not found.',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated.',
  })
  remove(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('budget_id', ParseUUIDPipe) budget_id: string,
  ): Promise<{ message: string }> {
    const user = req.user as IPayloadToken;
    return this.transactionsService.remove(id, budget_id, user.sub);
  }
}
