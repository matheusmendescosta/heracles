import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller()
export class GetProductsController {
  constructor(private prisma: PrismaService) {}

  @Get('/products')
  @UseGuards(AuthGuard('jwt'))
  async handler() {
    const products = await this.prisma.product.findMany({
      include: {
        productOptionals: true,
      },
    });

    return { products };
  }
}
