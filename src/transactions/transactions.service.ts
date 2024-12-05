import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { BudgetsService } from 'src/budgets/budgets.service';
import { Budget } from 'src/budgets/entities/budget.entity';
import { FilterTransactionDto } from './dto/filter-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly budgetService: BudgetsService,
  ) {}

  // Crear una transacción
  async create(
    user_id: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const { budget_id, amount, date, description } = createTransactionDto;

    // check if the budget is active and belongs to the user
    // and the transaction exists.
    const budget = await this.budgetService.findOneActive(budget_id, user_id);

    if (amount <= 0) {
      throw new BadRequestException('The amount must be greater than 0.');
    }

    const currentDate = new Date();

    if (
      new Date(date) < new Date(budget.start_date) ||
      new Date(date) > new Date(budget.end_date) ||
      new Date(date) > currentDate
    ) {
      throw new BadRequestException(
        'The date must be within the budget range or not be higher than the current date.',
      );
    }

    const transaction = this.transactionRepository.create({
      budget_id,
      amount,
      date,
      description,
    });

    await this.transactionRepository.save(transaction);

    // Send alerts based on budget spending thresholds.
    await this.budgetService.sendAlertsByBudgetSpendingPercentages(
      user_id,
      budget_id,
      transaction.amount,
    );

    return;
  }

  // Obtener todas las transacciones con filtros opcionales
  async findAll(
    budget_id: string,
    user_id: string,
    { min_day, max_day, min_amount, max_amount }: FilterTransactionDto,
  ): Promise<Transaction[]> {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoin(
        Budget,
        'budget',
        'budget.id = :budget_id AND budget.user_id = :user_id',
        {
          budget_id,
          user_id,
        },
      );

    if (min_amount)
      query.andWhere('transaction.amount >= :minAmount', { min_amount });
    if (max_amount)
      query.andWhere('transaction.amount <= :maxAmount', { max_amount });

    let transactions = await query.getMany();

    if (transactions) {
      if (min_day)
        transactions = transactions.filter(
          (transaction) => transaction.date.getDate() >= min_day,
        );

      if (max_day)
        transactions = transactions.filter(
          (transaction) => transaction.date.getDate() <= max_day,
        );

      if (min_day && max_day)
        transactions = transactions.filter(
          (transaction) =>
            transaction.date.getDate() >= min_day &&
            transaction.date.getDate() <= max_day,
        );
    }

    return transactions;
  }

  async findOne(id: string, budget_id: string, user_id: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id, budget: { id: budget_id, user_id } },
      relations: ['budget'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found.`);
    }

    return transaction;
  }

  async update(
    id: string,
    user_id: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const { budget_id, amount, date } = updateTransactionDto;

    // check if the budget is active and belongs to the user
    // and the transaction exists.
    const budget = await this.budgetService.findOneActive(budget_id, user_id);

    const transaction = await this.transactionRepository.findOne({
      where: { id, budget_id, budget: { user_id } },
      relations: ['budget'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found.`);
    }

    if (amount && amount <= 0) {
      throw new BadRequestException('The amount must be greater than 0.');
    }

    if (date) {
      const currentDate = new Date();
      if (
        new Date(date) < new Date(budget.start_date) ||
        new Date(date) > new Date(budget.end_date) ||
        new Date(date) > currentDate
      ) {
        throw new BadRequestException(
          'The new date must be within the budget range or not be higher than the current date.',
        );
      }
    }

    Object.assign(transaction, updateTransactionDto);

    const updatedTransaction =
      await this.transactionRepository.save(transaction);

    // If the amount was modified, Send alerts
    // based on budget spending thresholds.
    if (amount)
      this.budgetService.sendAlertsByBudgetSpendingPercentages(
        user_id,
        budget_id,
        updatedTransaction.amount,
      );

    return updatedTransaction;
  }

  // Eliminar una transacción
  async remove(
    id: string,
    budget_id: string,
    user_id: string,
  ): Promise<{ message: string }> {
    try {
      // first check the budget is active and belongs to the user
      // and the transaction exists.
      const budget = await this.budgetService.findOneActive(budget_id, user_id);

      const transaction = await this.transactionRepository.findOne({
        where: {
          id,
          budget: { id: budget.id, user_id },
        },
      });

      if (!transaction)
        throw new NotFoundException(`Transaction with ID ${id} not found.`);

      const result = await this.transactionRepository.delete(transaction);

      if (!result.affected)
        throw new NotFoundException('Transaction could not be deleted.');

      return { message: 'Transaction deleted successfully' };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
