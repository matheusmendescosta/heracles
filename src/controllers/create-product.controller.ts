import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe';
import { PrismaService } from 'src/prisma/prisma.service';
import z from 'zod';

const CreateProductSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  stock: z.number(),
  sku: z.string().optional(),
  options: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        price: z.number(),
      }),
    )
    .optional()
    .default([]),
});

type CreateProductBody = z.infer<typeof CreateProductSchema>;

@Controller('/products')
@UseGuards(AuthGuard('jwt'))
export class CreateProductController {
  constructor(private prisma: PrismaService) {}
  @Post()
  async handler(
    @Body(new ZodValidationPipe(CreateProductSchema)) body: CreateProductBody,
  ) {
    const { name, description, price, stock, sku, options } = body;

    await this.prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        sku,
        productOptionals:
          options.length > 0
            ? {
                create: options,
              }
            : undefined,
      },
    });
  }
}
