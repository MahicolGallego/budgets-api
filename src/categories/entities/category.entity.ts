import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Budget } from 'src/budgets/entities/budget.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Unique(['name', 'user_id']) // define constraint to be unique for name and user
@Entity('categories') // Nombre de la tabla
export class Category {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty()
  @Column({ type: 'uuid', nullable: true, default: null })
  user_id: string;

  @Exclude()
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Exclude()
  @ManyToOne(() => User, (user) => user.categories, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Exclude()
  @OneToMany(() => Budget, (budget) => budget.category)
  budgets: Budget[];
}
