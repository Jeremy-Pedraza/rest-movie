import { IRequestUser } from '@modules/auth/interfaces/request-with-user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: IRequestUser;
      requestId?: string;
    }
  }
}

export {};
