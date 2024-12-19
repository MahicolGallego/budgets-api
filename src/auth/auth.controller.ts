import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { LocalAuthGuard } from './guards/jwt/local-auth.guard';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Registers a new user with name, email, and password. Returns the authentication token and user data.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Data required to register a user',
  })
  @ApiCreatedResponse({
    description: 'user successfully registered.',
    type: User,
    schema: {
      example: {
        accessToken: 'JWT_TOKEN',
        user: {
          id: 'uuid',
          name: 'Jane Smith',
          email: 'janesmith@example.com',
          onboarding: 'false',
          role: 'user',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data. Validation failed.',
    schema: {
      example: {
        statusCode: 400,
        message: ['name should not be empty', 'email must be an email'],
        error: 'Bad Request',
      },
    },
  })
  async createUser(
    @Body() createDoctorDto: CreateUserDto,
  ): Promise<{ accessToken: string; user: User }> {
    return await this.authService.registerUser(createDoctorDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({
    summary: 'Login a user',
    description:
      'Authenticate a user using email and password. Returns a JWT token and user information.',
  })
  @ApiBody({
    description: 'Credentials for login',
    schema: {
      example: {
        email: 'user@example.com',
        password: 'your_password',
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Login successful. JWT token and user data returned.',
    schema: {
      example: {
        accessToken: 'JWT_TOKEN',
        user: {
          id: 'uuid',
          name: 'Jane Smith',
          email: 'janesmith@example.com',
          onboarding: 'false',
          role: 'user',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials provided.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  login(@Req() req: Request) {
    const user = req.user as User;
    const jwtAndUser = this.authService.generateJwtToken(user);
    return jwtAndUser;
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verify the validity of a JWT token',
    description:
      'Checks if the provided JWT token is valid and has not expired.',
  })
  @ApiBody({
    description: 'JWT token to verify',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiOkResponse({
    description: 'Token verification result.',
    schema: {
      example: {
        token_is_valid: true,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid token provided.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid or expired token',
        error: 'Bad Request',
      },
    },
  })
  verifyToken(@Body('token') token: string): {
    token_is_valid: boolean;
  } {
    return this.authService.verifyToken(token);
  }
}
