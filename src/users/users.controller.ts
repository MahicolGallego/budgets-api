import { Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { IPayloadToken } from 'src/common/interfaces/payload-token.interface';
import { Roles } from 'src/common/constants/enums/roles.enum';

@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('onboarding-viewed')
  @ApiOkResponse({
    description:
      'Marks the onboarding process as viewed for the authenticated user.',
    schema: {
      example: {
        id: 'b2c6e182-6aef-4c38-8d26-9153d7ebc7d2',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: Roles.USER,
        onboarding: true,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access. The user must be authenticated.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error: The user data could not be updated.',
  })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred while updating the onboarding status.',
  })
  async onboardingViewed(@Req() req: Request): Promise<User> {
    const user = req.user as IPayloadToken;
    return await this.usersService.onboardingViewed(user.sub);
  }
}
