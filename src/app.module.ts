import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { envSchema } from './env';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { ServiceModule } from './modules/service/service.module';
import { ControllersModule } from './controllers/controllers.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    IntegrationsModule,
    ServiceModule,
    ControllersModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
