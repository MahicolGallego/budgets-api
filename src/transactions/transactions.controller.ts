import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';

@ApiTags('Transactions') // Define el grupo en Swagger
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' }) // Describe el endpoint
  @ApiResponse({ status: 201, description: 'Transaction successfully created.', type: Transaction }) // Respuesta exitosa
  @ApiResponse({ status: 400, description: 'Invalid input.' }) // Error de validación
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all transactions' }) // Describe el endpoint
  @ApiResponse({ status: 200, description: 'List of transactions retrieved successfully.', type: [Transaction] }) // Respuesta exitosa
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a transaction by ID' }) // Describe el endpoint
  @ApiParam({ name: 'id', description: 'Transaction ID', required: true }) // Documenta el parámetro
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully.', type: Transaction }) // Respuesta exitosa
  @ApiResponse({ status: 404, description: 'Transaction not found.' }) // Error de no encontrado
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction by ID' }) // Describe el endpoint
  @ApiParam({ name: 'id', description: 'Transaction ID', required: true }) // Documenta el parámetro
  @ApiResponse({ status: 200, description: 'Transaction successfully updated.', type: Transaction }) // Respuesta exitosa
  @ApiResponse({ status: 404, description: 'Transaction not found.' }) // Error de no encontrado
  @ApiResponse({ status: 400, description: 'Invalid input.' }) // Error de validación
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction by ID' }) // Describe el endpoint
  @ApiParam({ name: 'id', description: 'Transaction ID', required: true }) // Documenta el parámetro
  @ApiResponse({ status: 200, description: 'Transaction successfully deleted.' }) // Respuesta exitosa
  @ApiResponse({ status: 404, description: 'Transaction not found.' }) // Error de no encontrado
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }
}