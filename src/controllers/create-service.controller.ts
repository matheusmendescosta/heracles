import { Body, Controller, Post, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/current-user-decorator';
import { userPayload } from 'src/auth/jwt.strategy';
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContaAzulServicoService } from 'src/modules/integrations/services/conta-azul-servico.service';
import z from 'zod';

const CreateServiceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  criarNoContaAzul: z.boolean().optional().default(true),
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
  private readonly logger = new Logger(CreateServiceController.name);

  constructor(
    private prisma: PrismaService,
    private servicoService: ContaAzulServicoService,
  ) {}

  @Post('/services')
  @UseGuards(AuthGuard('jwt'))
  async handler(
    @CurrentUser() user: userPayload,
    @Body(new ZodValidationPipe(CreateServiceSchema))
    body: createServiceBody,
  ) {
    const { name, description, price, criarNoContaAzul, options } = body;

    let idContaAzul: string | null = null;

    // Tentar criar no Conta Azul se solicitado
    if (criarNoContaAzul) {
      try {
        this.logger.debug(`Criando serviço no Conta Azul: ${name}`);
        const servicoCriado = await this.servicoService.criarServico(
          user.sub,
          name,
          description,
          price,
        );

        idContaAzul = servicoCriado?.id || servicoCriado?.codigo;
        this.logger.log(`✅ Serviço criado no Conta Azul com ID: ${idContaAzul}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `❌ Erro ao criar serviço no Conta Azul: ${message}`,
        );
        // Não lançar erro, apenas registrar
      }
    }

    // Criar serviço localmente
    const service = await this.prisma.service.create({
      data: {
        name,
        description,
        price,
        idContaAzul, // Salvar ID do Conta Azul se foi criado
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

