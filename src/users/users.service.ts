import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';
import { hashPassword } from 'src/common/helpers/hash-password.helper';
import { plainToClass } from 'class-transformer';

// Mark the UsersService class as injectable, allowing it to be used in other classes
@Injectable()
export class UsersService {
  //inject dependencies through the constructor
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ accessToken: string; user: User }> {
    try {
      const newUser = this.userRepository.create(createUserDto);
      newUser.email = createUserDto.email.toLowerCase().trim();
      newUser.password = await hashPassword(
        newUser.password,
        this.configService,
      );

      const createdUser = await this.userRepository.save(newUser);

      const userTransformClass = plainToClass(User, createdUser);

      // return access credentials after create the user
      return this.authService.generateJwtToken(userTransformClass);
    } catch (error) {
      console.error('Error during user registration:', error);
      throw error;
    }
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string) {
    return await this.userRepository.findOne({ where: { id } });
  }
}
