import { Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtModuleOptions } from './jwt.interfaces';
import { CONFIG_OPTIONS } from './jwt.constants';

@Injectable()
export class JwtService {
  constructor(@Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions) {}

  sign(payload: Record<string, unknown>): string {
    return jwt.sign(payload, this.options.privateKey, { expiresIn: '12h' });
  }
  verify(token: string) {
    return jwt.verify(token, this.options.privateKey);
  }
}
