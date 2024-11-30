import { Exclude } from 'class-transformer';
import { Budget } from 'src/budgets/entities/budget.entity';
import { Category } from 'src/categories/entities/category.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('users') // name for the table
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Exclude() // not included this column in the responses
  @Column({ type: 'varchar' })
  password: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'boolean', default: false })
  onboarding: boolean;

  @Column({ type: 'uuid', nullable: true, default: null })
  reset_token: string;

  @Column({ type: 'timestamp', nullable: true, default: null })
  reset_token_expires: Date;

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @OneToMany(() => Budget, (budget) => budget.user)
  budgets: Budget[];
}
