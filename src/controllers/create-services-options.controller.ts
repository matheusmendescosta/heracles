import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe';
import { PrismaService } from 'src/prisma/prisma.service';
import z from 'zod';

const ServiceOptionsBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  serviceId: z.string(),
});

type serviceOptionsBody = z.infer<typeof ServiceOptionsBodySchema>;

@Controller()
export class CreateServicesOptionsController {
  constructor(private prisma: PrismaService) {}

  @Post('/services/options')
  @UseGuards(AuthGuard('jwt'))
  async handler(
    @Body(new ZodValidationPipe(ServiceOptionsBodySchema))
    body: serviceOptionsBody,
  ) {
    const { name, description, price, serviceId } = body;

    await this.prisma.serviceOption.create({
      data: {
        name,
        description,
        price,
        serviceId,
      },
    });
  }
}
