import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exception.filter';
import helmet from 'helmet';
import morgan from 'morgan';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn', 'log'] 
      : ['error', 'warn', 'log', 'debug'],
  });
  
  app.setGlobalPrefix('api');
  
  app.use(helmet());

  if (process.env.NODE_ENV === 'production') {
    const warnings: string[] = [];
    const jwtSecret = process.env.JWT_SECRET || '';
    const orderPublicSecret = process.env.ORDER_PUBLIC_SECRET || '';
    const databaseUrl = process.env.DATABASE_URL || '';
    const midtransIsProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY || '';

    if (!jwtSecret || jwtSecret.includes('change-me')) {
      warnings.push('JWT_SECRET is missing or uses placeholder value.');
    }

    if (!orderPublicSecret) {
      warnings.push('ORDER_PUBLIC_SECRET is not set. Public order token falls back to JWT_SECRET.');
    }

    if (!databaseUrl || databaseUrl.includes('change-me')) {
      warnings.push('DATABASE_URL appears to use placeholder credentials.');
    }

    if (!midtransServerKey) {
      warnings.push('MIDTRANS_SERVER_KEY is missing.');
    }

    if (midtransIsProduction && midtransServerKey.startsWith('SB-')) {
      warnings.push('MIDTRANS_IS_PRODUCTION=true but Midtrans server key looks like sandbox key (SB-).');
    }

    warnings.forEach((message) => logger.warn(`[SECURITY_CONFIG] ${message}`));
  }
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  app.useGlobalFilters(new AllExceptionsFilter());
  
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
  }
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  
  logger.log(`Application running on port ${port}`);
}
bootstrap();
