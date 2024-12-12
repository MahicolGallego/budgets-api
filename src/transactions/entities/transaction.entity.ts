import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';
import { Budget } from 'src/budgets/entities/budget.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('transactions')
export class Transaction {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column('uuid')
  budget_id: string;

  @ApiProperty()
  @Transform(({ value }) => parseFloat(value))
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @ApiProperty()
  // assure that the value is a Date type
  @Transform(({ value }) => (value instanceof Date ? value : new Date(value)))
  @Column('timestamp')
  date: Date;

  @Exclude()
  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true })
  description: string;

  @Exclude()
  @ManyToOne(() => Budget, (budget) => budget.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;
}
