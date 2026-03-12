// src/modules/auth/interfaces/auth-response.interface.ts

import { IUserResponse } from '@modules/user/interfaces';

export interface ITokenPayload {
  sub: string;
  email: string;
  roles: string[];
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface ILoginResponse {
  user: IUserResponse;
  tokens: IAuthTokens;
}

export interface IRegisterResponse {
  user: IUserResponse;
  message: string;
}
