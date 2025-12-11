import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AuthenticateController } from './controllers/authenticate-controller';
import { CreateAccountController } from './controllers/create-account.controller';
import { CreateClientController } from './controllers/create-client.controller';
import { envSchema } from './env';
import { PrismaService } from './prisma/prisma.service';
import { CreateServicesController } from './controllers/create-services.controller';
import { CreateServiceWithOptionsController } from './controllers/create-service-with-options.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AuthModule,
  ],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateClientController,
    CreateServicesController,
    CreateServiceWithOptionsController,
  ],
  providers: [PrismaService],
})
export class AppModule {}
