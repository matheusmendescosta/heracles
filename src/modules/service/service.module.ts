import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListServicesController } from './controllers/list-services.controller';
import { ListServicesService } from './services/list-services.service';
import { ListServicesRepository } from './repositories/list-services.repository';

@Module({
  controllers: [ListServicesController],
  providers: [ListServicesService, ListServicesRepository, PrismaService],
  exports: [ListServicesService],
})
export class ServiceModule {}
