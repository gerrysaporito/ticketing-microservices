import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { BadRequestError, validateRequest } from '@gerrysaporito/ticketing-common';
import { User } from '../models/user';
import { Password } from '../services/password';

const router = express.Router();

router.post('/api/users/signin', [
  body('email')
    .isEmail()
    .withMessage('email must be valid'),
  body('password')
    .trim()
    .isLength({min: 4})
    .notEmpty()
    .withMessage('You must supply a password.'),
  validateRequest
], async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({email});

  if (!existingUser) {
    throw new BadRequestError('Login request failed.')
  }

  const passwordsMatch = await Password.compare(existingUser.password, password);

  if (!passwordsMatch) {
    throw new BadRequestError('Login request failed.')
  }

  // Generate JWT
  const userJwt = jwt.sign({
    id: existingUser.id,
    email: existingUser.email
  }, process.env.JWT_KEY!);

  // Store it on a session
  req.session = {
    jwt: userJwt
  };

  res
    .status(200)
    .send(existingUser);
});

export { router as signinRouter };
