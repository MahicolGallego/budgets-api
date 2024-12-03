import { forwardRef, Module } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { Budget } from './entities/budget.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from 'src/categories/categories.module';
import { UsersModule } from 'src/users/users.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Budget]), CategoriesModule, UsersModule, forwardRef(() => TransactionsModule)],
  exports: [BudgetsService],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
