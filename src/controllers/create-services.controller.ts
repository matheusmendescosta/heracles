import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/current-user-decorator';
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe';
import { PrismaService } from 'src/prisma/prisma.service';
import z from 'zod';

const CreateServiceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
});

type createServiceBody = z.infer<typeof CreateServiceSchema>;

@Controller()
export class CreateServicesController {
  constructor(private prisma: PrismaService) {}

  @Post('/services')
  @UseGuards(AuthGuard('jwt'))
  async handler(
    @Body(new ZodValidationPipe(CreateServiceSchema)) body: createServiceBody,
  ) {
    const { name, description, price } = body;

    await this.prisma.service.create({
      data: {
        name,
        description,
        price,
      },
    });
  }
}
