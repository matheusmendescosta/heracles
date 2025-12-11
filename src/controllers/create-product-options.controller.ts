import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe';
import { PrismaService } from 'src/prisma/prisma.service';
import z from 'zod';

const ProductOptionsBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  productId: z.string(),
  selected: z.boolean().optional().default(false),
});

type productOptionsBody = z.infer<typeof ProductOptionsBodySchema>;

@Controller()
export class CreateProductOptionsController {
  constructor(private prisma: PrismaService) {}

  @Post('/products/options')
  @UseGuards(AuthGuard('jwt'))
  async handler(
    @Body(new ZodValidationPipe(ProductOptionsBodySchema))
    body: productOptionsBody,
  ) {
    const { name, description, price, productId, selected } = body;

    await this.prisma.productOptional.create({
      data: {
        name,
        description,
        price,
        productId,
        selected,
      },
    });
  }
}
