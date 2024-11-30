import { Roles } from '../constants/enums/roles.enum';

export interface IPayloadToken {
  sub: string;
  role: Roles;
}
