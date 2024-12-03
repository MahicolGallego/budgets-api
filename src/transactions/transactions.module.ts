import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { BudgetsModule } from 'src/budgets/budgets.module';
import { Transaction } from './entities/transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), BudgetsModule],
  exports: [TransactionsService],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
