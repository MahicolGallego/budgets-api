import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Budget } from 'src/budgets/entities/budget.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Roles } from 'src/common/constants/enums/roles.enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('users') // name for the table
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Exclude() // not included this column in the responses
  @Column({ type: 'varchar' })
  password: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: Roles, default: Roles.USER })
  role: Roles;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  onboarding: boolean;

  @Exclude()
  @Column({ type: 'uuid', nullable: true, default: null })
  reset_token: string;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true, default: null })
  reset_token_expires: Date;

  @Exclude()
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Exclude()
  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @Exclude()
  @OneToMany(() => Budget, (budget) => budget.user)
  budgets: Budget[];
}
