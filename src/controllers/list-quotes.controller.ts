import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller()
export class ListQuoteController {
  constructor(private prisma: PrismaService) {}

  @Get('/quotes')
  //@UseGuards(AuthGuard('jwt'))
  async handler() {
    const quotes = await this.prisma.quote.findMany({
      include: {
        client: true,
        items: {
          include: {
            service: {
              include: {
                serviceOptions: true,
              },
            },
            product: {
              include: {
                productOptionals: true,
              },
            },
          },
        },
      },
    });

    return { quotes };
  }
}
