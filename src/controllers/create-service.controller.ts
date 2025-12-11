import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe';
import { PrismaService } from 'src/prisma/prisma.service';
import z from 'zod';

const CreateServiceSchema = z.object({
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

type createServiceBody = z.infer<typeof CreateServiceSchema>;

@Controller()
export class CreateServiceController {
  constructor(private prisma: PrismaService) {}

  @Post('/services')
  @UseGuards(AuthGuard('jwt'))
  async handler(
    @Body(new ZodValidationPipe(CreateServiceSchema))
    body: createServiceBody,
  ) {
    const { name, description, price, options } = body;

    const service = await this.prisma.service.create({
      data: {
        name,
        description,
        price,
        serviceOptions:
          options.length > 0
            ? {
                create: options,
              }
            : undefined,
      },
      include: {
        serviceOptions: true,
      },
    });

    return {
      service,
    };
  }
}
