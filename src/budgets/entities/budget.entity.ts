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
import { ApiProperty } from '@nestjs/swagger';

@Unique(['name', 'user_id'])
@Entity('budgets')
export class Budget {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: string;

  @Exclude()
  @Column('uuid')
  user_id: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Exclude()
  @Column('uuid')
  category_id: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty()
  @Column({ type: 'date' })
  start_date: Date;

  @ApiProperty()
  @Column({ type: 'date' })
  end_date: Date;

  @ApiProperty()
  @Column({ type: 'enum', enum: budgetStatus, default: budgetStatus.PENDING })
  status: budgetStatus;

  @Exclude()
  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @ManyToOne(() => User, (user) => user.budgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty()
  @ManyToOne(() => Category, (category) => category.budgets)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Exclude()
  @OneToMany(() => Transaction, (transaction) => transaction.budget)
  transactions: Transaction[];
}
