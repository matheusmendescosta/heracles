import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ListServicesRepository {
  constructor(private prisma: PrismaService) {}

  async findAllServices() {
    return this.prisma.service.findMany({
      include: {
        serviceOptions: true,
      },
    });
  }
}
