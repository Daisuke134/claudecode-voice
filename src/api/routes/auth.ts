import { Router, Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';

const authRouter = Router();

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest extends LoginRequest {
  name: string;
}

authRouter.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw Object.assign(new Error('Email and password are required'), { statusCode: 400 });
    }

    const token = 'jwt_token_placeholder';
    const user = {
      id: '1',
      email,
      name: 'Test User'
    };

    res.json({
      success: true,
      data: {
        token,
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw Object.assign(new Error('All fields are required'), { statusCode: 400 });
    }

    const user = {
      id: '2',
      email,
      name
    };

    res.status(201).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export { authRouter };