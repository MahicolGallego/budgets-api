import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { BudgetsService } from 'src/budgets/budgets.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly budgetService: BudgetsService
  ) {}

  // Crear una transacción
  async create(user_id: string, createTransactionDto: CreateTransactionDto) {
    const { budget_id, amount, date, description } = createTransactionDto;

    if (amount <= 0) {
      throw new BadRequestException('The amount must be greater than 0.');
    }

    const budget = await this.budgetService.findOne( budget_id, user_id );

    if (!budget) {
      throw new NotFoundException(`Budget with ID ${budget_id} not found.`);
    }

    if (new Date(date) < new Date(budget.start_date) || new Date(date) > new Date(budget.end_date)) {
      throw new BadRequestException('The date must fall within the budget range.');
    }

    const transaction = this.transactionRepository.create({
      budget_id,
      amount,
      date,
      description,
    });

    return this.transactionRepository.save(transaction);
  }

  // Obtener todas las transacciones con filtros opcionales
  async findAll(minDate?: string, maxDate?: string, minAmount?: number, maxAmount?: number) {
    const query = this.transactionRepository.createQueryBuilder('transaction');

    if (minDate) query.andWhere('transaction.date >= :minDate', { minDate });
    if (maxDate) query.andWhere('transaction.date <= :maxDate', { maxDate });
    if (minAmount) query.andWhere('transaction.amount >= :minAmount', { minAmount });
    if (maxAmount) query.andWhere('transaction.amount <= :maxAmount', { maxAmount });

    return query.getMany();
  }

  // Obtener una transacción específica
  async findOne(id: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['budget'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found.`);
    }

    return transaction;
  }

  // Actualizar una transacción
  async update(user_id: string, id: string, updateTransactionDto: UpdateTransactionDto) {
    const { budget_id, amount, date } = updateTransactionDto;

    const transaction = await this.transactionRepository.findOne({ where: { id } });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found.`);
    }

    if (amount !== undefined && amount <= 0) {
      throw new BadRequestException('The amount must be greater than 0.');
    }

    if (budget_id || date) {
      const budget = await this.budgetService.findOne( budget_id, user_id );

      // budget_id ?? transaction.budget_id

      if (!budget) {
        throw new NotFoundException(`Budget with ID ${budget_id} not found.`);
      }

      if (date && (new Date(date) < new Date(budget.start_date) || new Date(date) > new Date(budget.end_date))) {
        throw new BadRequestException('The date must fall within the budget range.');
      }

      transaction.budget = budget;
    }

    Object.assign(transaction, updateTransactionDto);

    return this.transactionRepository.save(transaction);
  }

  // Eliminar una transacción
  async remove(id: string) {
    const transaction = await this.transactionRepository.findOne({ where: { id } });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found.`);
    }

    return this.transactionRepository.remove(transaction);
  }
}