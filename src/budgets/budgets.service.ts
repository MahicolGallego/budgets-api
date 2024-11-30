import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Budget } from './entities/budget.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { CategoriesService } from 'src/categories/categories.service';
import { FilterBudgetDto } from './dto/filter-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>,
    // private readonly categoriesService: CategoriesService,
  ) {}
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

  findOne(id: string, user_id: string): Promise<Budget> {
    try {
      const budget = this.budgetsRepository.findOne({
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

  update(id: number, updateBudgetDto: UpdateBudgetDto) {
    return `This action updates a #${id} budget`;
  }

  remove(id: number) {
    return `This action removes a #${id} budget`;
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
}
