import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Budget } from './entities/budget.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
// import { CategoriesService } from 'src/categories/categories.service';
import { FilterBudgetDto } from './dto/filter-budget.dto';
import { budgetStatus } from 'src/common/constants/enums/budget-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>,
    // private readonly categoriesService: CategoriesService,
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

  create(createBudgetDto: CreateBudgetDto) {
    return 'This action adds a new budget';
  }

  async findAll(user_id: string, filterOptions: FilterBudgetDto) {
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
        relations: ['transactions'],
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

  update(id: string, updateBudgetDto: UpdateBudgetDto) {
    return `This action updates a #${id} budget`;
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
