import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { Express, RequestHandler } from 'express';
import { storage } from './storage';
import { User } from '@shared/schema';

const PgSession = connectPg(session);

export function setupAuth(app: Express): void {
  // Session configuration
  const sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: 7 * 24 * 60 * 60, // 7 days
    tableName: 'sessions',
  });

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({
    success: false,
    error: 'Authentication required',
  });
};

export const optionalAuth: RequestHandler = (req, res, next) => {
  // Add user information if authenticated, but don't require it
  next();
};

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export function generateShareToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}