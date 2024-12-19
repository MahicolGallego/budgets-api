import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Budget } from './entities/budget.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { FilterBudgetDto } from './dto/filter-budget.dto';
import { budgetStatus } from 'src/common/constants/enums/budget-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import AlertsGateway from 'src/alerts/alert.gateway';
import { IBudgetBalance } from './interfaces/balance.interface';
import { IAlertMessage } from 'src/common/interfaces/alert-message.interface';
import { alert_type } from 'src/common/constants/enums/alert-type.enum';
import { alert_message } from 'src/common/constants/enums/alert-message.enum';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>,
    private readonly categoriesService: CategoriesService,
    private readonly alertsGateway: AlertsGateway,
  ) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, {
    timeZone: 'UTC',
  })
  handleUpdatesBudgetsStatus() {
    try {
      const currentDate = new Date();
      this.updateBudgetStatusToActive(currentDate);
      this.updateBudgetStatusToCompleted(currentDate);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async create(
    user_id: string,
    createBudgetDto: CreateBudgetDto,
  ): Promise<Budget> {
    const { name, category_name, amount, month } = createBudgetDto;

    const currentYear = new Date().getUTCFullYear();
    const currentMonth = new Date().getUTCMonth();

    if (month < currentMonth) {
      throw new BadRequestException(
        'The selected month cannot be in the past.',
      );
    }

    // Calculate start and end dates in UTC format
    const start_date = new Date(Date.UTC(currentYear, month, 1));
    const end_date = new Date(Date.UTC(currentYear, month + 1, 0));
    end_date.setUTCHours(23, 59, 59); // set at the end of the day

    // define status for budget
    const status =
      month === currentMonth ? budgetStatus.ACTIVE : budgetStatus.PENDING;

    let category = await this.categoriesService.findByCategoryName(
      user_id,
      category_name,
    );

    // If the category does not exist, create it
    if (!category) {
      category = await this.categoriesService.create({
        name: category_name,
        user_id,
      });
    }

    try {
      const newBudget = this.budgetsRepository.create({
        user_id,
        name,
        category,
        amount,
        start_date,
        end_date,
        status,
      });

      return await this.budgetsRepository.save(newBudget);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findAll(
    user_id: string,
    filterOptions: FilterBudgetDto,
  ): Promise<Budget[]> {
    try {
      const whereClause: any = this.prepareBudgetWhereClause(
        user_id,
        filterOptions,
      );

      let budgets = await this.budgetsRepository.find({
        where: whereClause,
        order: {
          start_date: 'DESC',
        },
        relations: ['category'],
      });

      if (filterOptions.month)
        budgets = this.filterBudgetByMonth([...budgets], filterOptions.month);

      return budgets;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findOne(id: string, user_id: string): Promise<Budget> {
    try {
      const budget = await this.budgetsRepository.findOne({
        where: {
          id,
          user_id,
        },
        relations: ['category'],
      });
      if (!budget) {
        throw new NotFoundException('Budget not found');
      }
      return budget;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findOneActive(id: string, user_id: string): Promise<Budget> {
    try {
      const budget = await this.budgetsRepository.findOne({
        where: {
          id,
          user_id,
          status: budgetStatus.ACTIVE,
        },
      });
      if (!budget) {
        throw new NotFoundException(
          'Budget not found or currently not active. Unable to operate budget transactions that are not active',
        );
      }
      return budget;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async update(
    id: string,
    user_id: string,
    updateBudgetDto: UpdateBudgetDto,
  ): Promise<Budget> {
    const { name, amount, category_name, month } = updateBudgetDto;

    try {
      // search for the budget
      const budget = await this.budgetsRepository.findOne({
        where: { id, user_id },
      });
      if (!budget) {
        throw new NotFoundException('Budget not found.');
      }

      if (name) budget.name = name;
      if (amount) budget.amount = amount;

      // If the category to update does not exist, create it
      if (category_name) {
        const category = await this.categoriesService.findByCategoryName(
          user_id,
          category_name,
        );
        if (category) {
          budget.category_id = category.id;
        } else {
          const newCategory = await this.categoriesService.create({
            name: category_name,
            user_id,
          });
          budget.category_id = newCategory.id;
        }
      }

      if (month) {
        if (budget.status !== budgetStatus.PENDING)
          throw new BadRequestException(
            'The period of the budget cannot be updated if his status is active or completed',
          );

        const currentDate = new Date();

        if (month < currentDate.getUTCMonth()) {
          throw new BadRequestException(
            'The budget date cannot be updated to a month earlier than the current month.',
          );
        }

        // Calculate start and end dates in UTC format
        const start_date = new Date(
          Date.UTC(currentDate.getUTCFullYear(), month, 1),
        );
        const end_date = new Date(
          Date.UTC(currentDate.getUTCFullYear(), month + 1, 0),
        );
        end_date.setUTCHours(23, 59, 59); // set at the end of the day

        budget.start_date = start_date;
        budget.end_date = end_date;

        if (month === currentDate.getUTCMonth()) {
          budget.status = budgetStatus.ACTIVE;
        }
      }

      const result = await this.budgetsRepository.update(
        { id, user_id },
        budget,
      );

      if (!result.affected)
        throw new InternalServerErrorException(
          'Error: The budget could not be updated',
        );

      return await this.findOne(id, user_id);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async remove(
    id: string,
    user_id: string,
  ): Promise<{
    message: string;
  }> {
    try {
      const result = await this.budgetsRepository.delete({
        id,
        user_id,
      });

      if (!result.affected)
        throw new InternalServerErrorException(
          'Error: The budget could not be deleted',
        );

      return {
        message: 'Budget deleted successfully',
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getBalance(id: string, user_id: string): Promise<IBudgetBalance> {
    try {
      const budget = await this.budgetsRepository.findOne({
        where: { id, user_id },
        relations: ['transactions'],
      });
      if (!budget) {
        throw new NotFoundException(
          'Budget to calculate the balance not found',
        );
      }

      const initial_amount = budget.amount;

      const transactions = budget.transactions;

      if (!transactions.length) {
        return {
          initial_amount,
          spent_amount: 0,
          percentage_spent_amount: 0,
          remaining_amount: initial_amount,
          percentage_remaining_amount: 100,
        };
      }

      const spent_amount = transactions.reduce(
        (accumulated, currentTransaction) => {
          return accumulated + currentTransaction.amount;
        },
        0,
      );

      const percentage_spent_amount = (spent_amount * 100) / initial_amount;

      const remaining_amount =
        initial_amount - spent_amount <= 0 ? 0 : initial_amount - spent_amount;

      const percentage_remaining_amount =
        remaining_amount <= 0 ? 0 : (remaining_amount * 100) / initial_amount;

      // Return calculations with percentages to 2 decimal places
      return {
        initial_amount,
        spent_amount,
        percentage_spent_amount: parseFloat(percentage_spent_amount.toFixed(2)),
        remaining_amount,
        percentage_remaining_amount: parseFloat(
          percentage_remaining_amount.toFixed(2),
        ),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  prepareBudgetWhereClause(user_id: string, filterOptions: FilterBudgetDto) {
    const whereClause: any = { user_id };

    if (filterOptions.category)
      whereClause.category = { name: filterOptions.category };

    if (filterOptions.status) whereClause.status = filterOptions.status;

    return whereClause;
  }
  filterBudgetByMonth(listBudget: Budget[], monthToFilter: number) {
    return listBudget.filter(
      (budget) => budget.start_date.getUTCMonth() === monthToFilter,
    );
  }

  async updateBudgetStatusToActive(currentDate: Date) {
    try {
      // Searching by budgets for active
      let budgetsToActive = await this.budgetsRepository.find({
        where: { status: budgetStatus.PENDING },
      });

      if (!budgetsToActive.length) return;

      // filter by budgets that must be initiated the current month
      budgetsToActive = budgetsToActive.filter(
        (budget) =>
          budget.start_date.getUTCFullYear() === currentDate.getUTCFullYear() &&
          budget.start_date.getUTCMonth() === currentDate.getUTCMonth(),
      );

      if (!budgetsToActive.length) return;

      const budgetsToActiveIds = budgetsToActive.map((budget) => budget.id);

      // Updating budgets status to active
      await this.budgetsRepository.update(
        { id: In([budgetsToActiveIds]) },
        {
          status: budgetStatus.ACTIVE,
        },
      );

      console.log(`Updated budgets: actived ${budgetsToActiveIds.length}`);
    } catch (error) {
      console.error('Error during budget status update', error);
      throw error;
    }
  }

  async updateBudgetStatusToCompleted(currentDate: Date) {
    try {
      // Searching by budgets for completed
      let budgetsToCompleted = await this.budgetsRepository.find({
        where: { status: budgetStatus.ACTIVE },
      });

      if (!budgetsToCompleted.length) return;

      // filter by budgets that must be finish the previous mont
      budgetsToCompleted = budgetsToCompleted.filter(
        (budget) => budget.end_date.getTime() <= currentDate.getTime(),
      );

      if (!budgetsToCompleted.length) return;

      const budgetsToCompletedIds = budgetsToCompleted.map(
        (budget) => budget.id,
      );

      // Updating budgets status to active
      await this.budgetsRepository.update(
        { id: In([budgetsToCompletedIds]) },
        {
          status: budgetStatus.COMPLETED,
        },
      );

      console.log(`Updated budgets: completed ${budgetsToCompletedIds.length}`);
    } catch (error) {
      console.error('Error during budget status update', error);
      throw error;
    }
  }

  // Function to calculate the percentages of total expenses, with and without the amount
  // of the last transaction, to determine whether to send informative alerts to the user or not
  calculatePercentageTotalSpent(
    budget: Budget,
    amount_last_transaction: number,
  ): {
    percentage_before_last_transaction: number;
    percentage_after_last_transaction: number;
  } {
    try {
      const transactions = budget.transactions;

      if (!transactions)
        throw new InternalServerErrorException('No transactions found');

      const totalSpent = transactions.reduce(
        (total, transaction) => total + transaction.amount,
        0,
      ); // Calcula el total

      const totalSpentWithOutLastTransaction =
        totalSpent - amount_last_transaction;

      const percentage_before_last_transaction =
        (totalSpentWithOutLastTransaction * 100) / budget.amount;
      const percentage_after_last_transaction =
        (totalSpent * 100) / budget.amount;

      return {
        percentage_before_last_transaction,
        percentage_after_last_transaction,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error calculating total spent');
    }
  }

  async sendAlertsByBudgetSpendingPercentages(
    user_id: string,
    budgetId: string,
    amount_last_transaction: number,
  ) {
    try {
      const budget = await this.budgetsRepository.findOne({
        where: { id: budgetId, user_id },
        relations: ['transactions'], // Relacionar las transacciones con el presupuesto
      });

      if (!budget) {
        throw new NotFoundException('Budget not found');
      }

      const {
        percentage_before_last_transaction,
        percentage_after_last_transaction,
      } = this.calculatePercentageTotalSpent(budget, amount_last_transaction);

      if (percentage_after_last_transaction >= 50)
        this.sendAlert(
          budget,
          user_id,
          percentage_before_last_transaction,
          percentage_after_last_transaction,
        );

      return;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  sendAlert(
    budget: Budget,
    user_id: string,
    percentage_before_last_transaction: number,
    percentage_after_last_transaction: number,
  ) {
    let alertMessage: IAlertMessage;
    const currentDay = new Date().getUTCDate();

    if (
      percentage_before_last_transaction < 100 &&
      percentage_after_last_transaction >= 100 &&
      !alertMessage
    ) {
      alertMessage = {
        alert_type: alert_type.BY_HUNDRED_PERCENTAGE,
        budget_name: budget.name,
        message: alert_message.BY_HUNDRED_PERCENTAGE,
      };
    }

    if (
      percentage_before_last_transaction < 80 &&
      percentage_after_last_transaction >= 80 &&
      !alertMessage
    ) {
      alertMessage = {
        alert_type: alert_type.BY_EIGHTY_PERCENTAGE,
        budget_name: budget.name,
        message: alert_message.BY_EIGHTY_PERCENTAGE,
      };
    }

    if (
      percentage_before_last_transaction < 50 &&
      percentage_after_last_transaction >= 50 &&
      currentDay <= 15 &&
      !alertMessage
    ) {
      alertMessage = {
        alert_type: alert_type.BY_FIFTY_PERCENTAGE,
        budget_name: budget.name,
        message: alert_message.BY_FIFTY_PERCENTAGE,
      };
    }

    if (alertMessage) this.alertsGateway.sendAlert(user_id, alertMessage);

    return;
  }
}
