import { Body, Controller, Post, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/current-user-decorator';
import { userPayload } from 'src/auth/jwt.strategy';
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContaAzulProdutoService } from 'src/modules/integrations/services/conta-azul-produto.service';
import z from 'zod';

const CreateProductSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  stock: z.number(),
  sku: z.string().optional(),
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

type CreateProductBody = z.infer<typeof CreateProductSchema>;

@Controller('/products')
@UseGuards(AuthGuard('jwt'))
export class CreateProductController {
  private readonly logger = new Logger(CreateProductController.name);

  constructor(
    private prisma: PrismaService,
    private produtoService: ContaAzulProdutoService,
  ) {}

  @Post()
  async handler(
    @CurrentUser() user: userPayload,
    @Body(new ZodValidationPipe(CreateProductSchema)) body: CreateProductBody,
  ) {
    const { name, description, price, stock, sku, criarNoContaAzul, options } =
      body;

    let idContaAzul: string | null = null;

    // Tentar criar no Conta Azul se solicitado
    if (criarNoContaAzul) {
      try {
        this.logger.debug(`Criando produto no Conta Azul: ${name}`);
        const produtoCriado = await this.produtoService.criarProduto(
          user.sub,
          name,
          description,
          price,
          stock,
          sku,
        );

        idContaAzul = produtoCriado?.id;
        this.logger.log(`✅ Produto criado no Conta Azul com ID: ${idContaAzul}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `❌ Erro ao criar produto no Conta Azul: ${message}`,
        );
        // Não lançar erro, apenas registrar
      }
    }

    // Criar produto localmente
    const product = await this.prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        sku,
        idContaAzul, // Salvar ID do Conta Azul se foi criado
        productOptionals:
          options.length > 0
            ? {
                create: options,
              }
            : undefined,
      },
    });

    return {
      product,
    };
  }
}

