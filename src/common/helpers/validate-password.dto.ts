import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export async function validatePassword(
  originalPassword: string,
  passwordToValidate: string,
) {
  try {
    if (!(await bcrypt.compare(passwordToValidate, originalPassword)))
      throw new UnauthorizedException('Invalid credentials');

    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
