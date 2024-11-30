import { Exclude } from 'class-transformer';
import { Category } from 'src/categories/entities/category.entity';
import { User } from 'src/users/entities/user.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { budgetStatus } from 'src/common/constants/enums/budget-status.enum';

@Unique(['name', 'user_id'])
@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column('uuid')
  category_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'enum', enum: budgetStatus })
  status: budgetStatus;

  @Exclude()
  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.budgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (category) => category.budgets)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Transaction, (transaction) => transaction.budget)
  transactions: Transaction[];
}
