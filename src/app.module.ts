import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AuthenticateController } from './controllers/authenticate-controller';
import { CreateAccountController } from './controllers/create-account.controller';
import { CreateClientController } from './controllers/create-client.controller';
import { CreateProductOptionsController } from './controllers/create-product-options.controller';
import { CreateProductController } from './controllers/create-product.controller';
import { CreateQuoteController } from './controllers/create-quote.controller';
import { CreateServiceController } from './controllers/create-service.controller';
import { CreateServicesOptionsController } from './controllers/create-services-options.controller';
import { GetQuoteController } from './controllers/get-quote.controller';
import { envSchema } from './env';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AuthModule,
    IntegrationsModule,
  ],
  controllers: [
    AuthenticateController,
    CreateAccountController,
    CreateClientController,
    CreateProductController,
    CreateProductOptionsController,
    CreateServiceController,
    CreateServicesOptionsController,
    CreateQuoteController,
    GetQuoteController,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
