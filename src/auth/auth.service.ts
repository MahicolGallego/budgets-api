import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { validatePassword } from 'src/common/helpers/validate-password.dto';
import { IPayloadToken } from 'src/common/interfaces/payload-token.interface';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(
    createUserDto: CreateUserDto,
  ): Promise<{ accessToken: string; user: User }> {
    return await this.usersService.create(createUserDto);
  }

  async validateUser(userCredentials: { email: string; password: string }) {
    try {
      const foundUser = await this.usersService.findByEmail(
        userCredentials.email,
      );

      if (!foundUser) throw new UnauthorizedException('Invalid credentials');

      //validate password
      await validatePassword(foundUser.password, userCredentials.password);

      return foundUser;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  generateJwtToken(user: User): { accessToken: string; user: User } {
    try {
      const payload: IPayloadToken = {
        sub: user.id,
        role: user.role,
      };

      return {
        accessToken: this.jwtService.sign(payload),
        user,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
