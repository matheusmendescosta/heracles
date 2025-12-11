import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe';
import { PrismaService } from 'src/prisma/prisma.service';
import z from 'zod';

const CreateServiceWithOptionsSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
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

type CreateServiceWithOptionsBody = z.infer<
  typeof CreateServiceWithOptionsSchema
>;

@Controller()
export class CreateServiceWithOptionsController {
  constructor(private prisma: PrismaService) {}

  @Post('/services/with-options')
  @UseGuards(AuthGuard('jwt'))
  async handler(
    @Body(new ZodValidationPipe(CreateServiceWithOptionsSchema))
    body: CreateServiceWithOptionsBody,
  ) {
    const { name, description, price, options } = body;

    const service = await this.prisma.service.create({
      data: {
        name,
        description,
        price,
        options: options.length > 0 ? {
          create: options,
        } : undefined,
      },
      include: {
        options: true,
      },
    });

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      options: service.options,
    };
  }
}
