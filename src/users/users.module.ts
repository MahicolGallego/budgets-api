import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => AuthModule)], // Import the User entity for use with TypeORM
  providers: [UsersService],
  exports: [UsersService], // Export UsersService for use in other modules that import this module
})
export class UsersModule {}
