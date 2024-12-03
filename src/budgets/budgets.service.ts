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
import { IBudgetBalance } from './interfaces/balance.interface';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, {
    timeZone: 'America/Bogota', // Set the specific time zone
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

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    if (month < currentMonth) {
      throw new BadRequestException(
        'The selected month cannot be in the past.',
      );
    }

    // Calculate start and end dates
    const start_date = new Date(currentYear, month, 1);
    const end_date = new Date(currentYear, month + 1, 0);

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

  async update(
    id: string,
    user_id: string,
    updateBudgetDto: UpdateBudgetDto,
  ): Promise<Budget> {
    const { name, amount, category_name, month } = updateBudgetDto;

    try {
      // Buscar el presupuesto
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

      //
      if (month) {
        if (budget.status !== budgetStatus.PENDING)
          throw new BadRequestException(
            'The period of the budget cannot be updated if his status is active or completed',
          );

        const currentDate = new Date();

        if (month < currentDate.getMonth()) {
          throw new BadRequestException(
            'The budget date cannot be updated to a month earlier than the current month.',
          );
        }
        const start_date = new Date(currentDate.getFullYear(), month, 1);
        const end_date = new Date(currentDate.getFullYear(), month + 1, 0);

        budget.start_date = start_date;
        budget.end_date = end_date;

        if (month === currentDate.getMonth()) {
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
      (budget) => budget.start_date.getMonth() === monthToFilter,
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
          budget.start_date.getFullYear() === currentDate.getFullYear() &&
          budget.start_date.getMonth() === currentDate.getMonth(),
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

      // filter by budgets that must be finish the previous month
      budgetsToCompleted = budgetsToCompleted.filter(
        (budget) =>
          budget.end_date.getFullYear() <= currentDate.getFullYear() &&
          budget.end_date.getMonth() < currentDate.getMonth(),
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
}
