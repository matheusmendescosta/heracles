import { Injectable } from '@nestjs/common';
import { userPayload } from 'src/auth/jwt.strategy';
import { ContaAzulServicoService } from 'src/modules/integrations/services/conta-azul-servico.service';
import { PrismaService } from 'src/prisma/prisma.service';
import z from 'zod';

const serviceBodySchema = z.object({
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

@Injectable()
export class CreateServicesService {
  constructor(
    private prisma: PrismaService,
    private servicoService: ContaAzulServicoService,
  ) {}

  async execute(body: z.infer<typeof serviceBodySchema>, user: userPayload) {
    const { name, description, price, criarNoContaAzul, options } = body;

    let idContaAzul: string | null = null;

    // Tentar criar no Conta Azul se solicitado
    if (criarNoContaAzul) {
      try {
        const servicoCriado = await this.servicoService.criarServico(
          user.sub,
          name,
          description,
          price,
        );

        idContaAzul = servicoCriado?.id || servicoCriado?.codigo;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Erro ao criar serviço no Conta Azul: ${message}`);
      }
    }

    // Criar o serviço localmente
    const createdService = await this.prisma.service.create({
      data: { name, description, price, idContaAzul },
    });

    // Criar as opções do serviço, se houver
    for (const option of options) {
      await this.prisma.serviceOption.create({
        data: {
          name: option.name,
          description: option.description,
          price: option.price,
          serviceId: createdService.id,
        },
      });
    }

    return createdService;
  }
}
