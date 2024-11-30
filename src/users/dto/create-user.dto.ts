import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The full name of the user.',
    minLength: 3,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'The name must be at least 3 characters long' })
  name: string;

  @ApiProperty({
    description: 'The user email address. It must be unique.',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'The password for the user account. It must have at least 6 characters.',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'The name must be at least 6 characters long' })
  password: string;
}
