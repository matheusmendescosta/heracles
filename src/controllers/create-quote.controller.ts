import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/current-user-decorator';
import { userPayload } from 'src/auth/jwt.strategy';
import { QuoteStatus } from 'src/generated/prisma/enums';
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe';
import { PrismaService } from 'src/prisma/prisma.service';
import z from 'zod';

const CreateQuoteSchema = z
  .object({
    number: z.number(),
    notes: z.string().optional(),
    signatureIp: z.string().optional(),
    clientId: z.string().optional(),
    client: z
      .object({
        name: z.string(),
        email: z.string().email(),
        document: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),
    signedAt: z.date().optional(),
    validUntil: z.date().optional(),
    totalValue: z.number(),
    status: z.enum(QuoteStatus).default(QuoteStatus.DRAFT),
    items: z
      .array(
        z.object({
          description: z.string(),
          productId: z.string().optional(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
          serviceId: z.string().optional(),
          selectedOptions: z.any().optional(),
        }),
      )
      .optional(),
  })
  .refine((data) => data.clientId || data.client, {
    message: 'Either clientId or client data must be provided',
    path: ['clientId'],
  });

type createQuoteBody = z.infer<typeof CreateQuoteSchema>;

@Controller()
export class CreateQuoteController {
  constructor(private prisma: PrismaService) {}

  @Post('/quotes')
  @UseGuards(AuthGuard('jwt'))
  async handler(
    @Body(new ZodValidationPipe(CreateQuoteSchema)) body: createQuoteBody,
    @CurrentUser() user: userPayload,
  ) {
    const {
      number,
      notes,
      signatureIp,
      clientId,
      client,
      signedAt,
      validUntil,
      totalValue,
      status,
      items,
    } = body;

    let finalClientId = clientId;

    // Create a new client if client data is provided
    if (client) {
      const createdClient = await this.prisma.client.create({
        data: {
          name: client.name,
          email: client.email,
          document: client.document,
          phone: client.phone,
          address: client.address,
        },
      });
      finalClientId = createdClient.id;
    }

    if (!finalClientId) {
      throw new Error('Client ID is required');
    }

    await this.prisma.quote.create({
      data: {
        number,
        userId: user.sub,
        notes,
        signatureIp,
        clientId: finalClientId,
        signedAt,
        validUntil,
        totalValue,
        status,
        items: items && items.length > 0 ? { create: items } : undefined,
      },
    });
  }
}
