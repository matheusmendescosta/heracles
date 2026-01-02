import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';
// import z from 'zod';

// const quoteParamsSchema = z.object({
//   id: z.string(),
// });

// type GetQuoteParams = z.infer<typeof quoteParamsSchema>;
@Controller()
export class GetQuoteController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/quote/:id')
  async handler(@Param('id') id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    return { quote };
  }
}
