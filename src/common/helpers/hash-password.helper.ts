import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

export async function hashPassword(
  password: string,
  configService: ConfigService,
): Promise<string> {
  try {
    const salt_rounds_str = configService.get<string>('HASH_SALT');

    if (!salt_rounds_str) throw new ConflictException('Salt rounds no set');

    const salt_rounds = parseInt(salt_rounds_str, 10);

    if (isNaN(salt_rounds))
      throw new ConflictException('Invalid salt rounds configuration');

    const hashPassword = await bcrypt.hash(password, salt_rounds);

    return hashPassword;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
