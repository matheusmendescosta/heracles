import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe';
import { z } from 'zod';

const clientBodySchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  document: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ClientBody = z.infer<typeof clientBodySchema>;

@Controller('client')
export class CreateClientController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async handler(
    @Body(new ZodValidationPipe(clientBodySchema)) body: ClientBody,
  ) {
    const { name, email, document, phone, address } = body;

    await this.prisma.client.create({
      data: {
        name,
        email,
        document,
        phone,
        address,
      },
    });
  }
}
