import { Body, Controller, Post, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/current-user-decorator';
import { userPayload } from 'src/auth/jwt.strategy';
import { QuoteStatus } from 'src/generated/prisma/enums';
import { Decimal } from 'src/generated/prisma/internal/prismaNamespace';
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContaAzulVendaService } from 'src/modules/integrations/services/conta-azul-venda.service';
import { ContaAzulPessoaService } from 'src/modules/integrations/services/conta-azul-pessoa.service';
import z from 'zod';

const CreateQuoteSchema = z
  .object({
    number: z.number(),
    notes: z.string().optional(),
    signatureIp: z.string().optional(),
    idClienteContaAzul: z.string().optional(),
    criarClienteNoContaAzul: z.boolean().optional().default(true),
    criarVendaNoContaAzul: z.boolean().optional().default(true),
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
          quantity: z.number().int().positive(),
          unitPrice: z.number().positive(),
          total: z.number().positive(),
          productId: z.string().optional(),
          serviceId: z.string().optional(),
          selectedOptionIds: z.array(z.string()).optional(),
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
  private readonly logger = new Logger(CreateQuoteController.name);

  constructor(
    private prisma: PrismaService,
    private vendaService: ContaAzulVendaService,
    private pessoaService: ContaAzulPessoaService,
  ) {}

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
      idClienteContaAzul,
      criarClienteNoContaAzul,
      criarVendaNoContaAzul,
      clientId,
      client,
      signedAt,
      validUntil,
      totalValue,
      status,
      items,
    } = body;

    let finalClientId = clientId;
    let finalIdClienteContaAzul = idClienteContaAzul;

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

      // Criar cliente também no Conta Azul se solicitado
      if (criarClienteNoContaAzul) {
        try {
          this.logger.log(
            `Criando cliente no Conta Azul: ${client.name}`,
          );

          const pessoaCriada = await this.pessoaService.criarCliente(
            user.sub,
            client.name,
            client.email,
            client.phone,
          );

          this.logger.debug(
            `Resposta da API Conta Azul: ${JSON.stringify(pessoaCriada)}`,
          );

          finalIdClienteContaAzul = pessoaCriada.id;

          this.logger.log(
            `✅ Cliente criado com sucesso no Conta Azul: ${pessoaCriada.id}`,
          );
          
          this.logger.debug(
            `ID capturado para criar venda: ${finalIdClienteContaAzul}`,
          );

          // Salvar o ID do cliente Conta Azul no banco de dados local
          await this.prisma.client.update({
            where: { id: finalClientId },
            data: { idContaAzul: finalIdClienteContaAzul },
          });

          this.logger.log(
            `✅ ID do Conta Azul salvo no cliente local: ${finalIdClienteContaAzul}`,
          );

          // Aguardar 5 segundos para o cliente ficar disponível no Conta Azul
          this.logger.debug(
            `Aguardando 3 segundos para o cliente ficar disponível na API...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `❌ Erro ao criar cliente no Conta Azul: ${message}`,
          );
          // Não lançar erro aqui, apenas registrar
        }
      }
    }

    if (!finalClientId) {
      throw new Error('Client ID is required');
    }

    // Process items and fetch selected options from database
    const processedItems = items
      ? await Promise.all(
          items.map(async (item) => {
            let selectedOptions:
              | { id: string; name: string; price: Decimal }[]
              | null = null;

            if (item.selectedOptionIds && item.selectedOptionIds.length > 0) {
              // Fetch product optionals or service options based on item type
              if (item.productId) {
                const productOptions =
                  await this.prisma.productOptional.findMany({
                    where: {
                      id: { in: item.selectedOptionIds },
                      productId: item.productId,
                    },
                    select: { id: true, name: true, price: true },
                  });
                selectedOptions = productOptions;
              } else if (item.serviceId) {
                const serviceOptions = await this.prisma.serviceOption.findMany(
                  {
                    where: {
                      id: { in: item.selectedOptionIds },
                      serviceId: item.serviceId,
                    },
                    select: { id: true, name: true, price: true },
                  },
                );
                selectedOptions = serviceOptions;
              }
            }

            const itemData: any = {
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              productId: item.productId,
              serviceId: item.serviceId,
            };

            if (selectedOptions) {
              itemData.selectedOptions = selectedOptions;
            }

            return itemData;
          }),
        )
      : undefined;

    const quote = await this.prisma.quote.create({
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
        items:
          processedItems && processedItems.length > 0
            ? { create: processedItems }
            : undefined,
      },
    });

    // Criar venda no Conta Azul se solicitado
    this.logger.debug(
      `Debug: criarVendaNoContaAzul=${criarVendaNoContaAzul}, idClienteContaAzul=${finalIdClienteContaAzul}`,
    );

    if (criarVendaNoContaAzul && finalIdClienteContaAzul) {
      try {
        this.logger.log(
          `Criando venda no Conta Azul para o orçamento ${quote.id}`,
        );

        await this.vendaService.criarVendaDoOrcamento(
          user.sub,
          finalIdClienteContaAzul,
          number,
          items || [],
          totalValue,
          notes,
        );

        this.logger.log(
          `✅ Venda criada com sucesso no Conta Azul para orçamento ${quote.id}`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `❌ Erro ao criar venda no Conta Azul: ${message}`,
        );
        // Não lançar erro aqui, apenas registrar para não falhar a criação do orçamento
      }
    }

    return {
      id: quote.id,
      number: quote.number,
      status: quote.status,
      message: 'Orçamento criado com sucesso',
    };
  }
}
