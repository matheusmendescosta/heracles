import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OAuthService } from './oauth/oauth.service';
import { OAuthController } from './oauth/oauth.controller';
import { IntegrationRepository } from './repositories/integration.repository';
import { ContaAzulProvider } from './providers/conta-azul/conta-azul.provider';
import { TokenRefreshService } from './services/token-refresh.service';
import { TokenValidationHelper } from './services/token-validation.helper';
import { ContaAzulVendaService } from './services/conta-azul-venda.service';
import { ContaAzulPessoaService } from './services/conta-azul-pessoa.service';
import { ContaAzulServicoService } from './services/conta-azul-servico.service';
import { ContaAzulProdutoService } from './services/conta-azul-produto.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    PrismaService,
    OAuthService,
    IntegrationRepository,
    ContaAzulProvider,
    TokenRefreshService,
    TokenValidationHelper,
    ContaAzulVendaService,
    ContaAzulPessoaService,
    ContaAzulServicoService,
    ContaAzulProdutoService,
  ],
  controllers: [OAuthController],
  exports: [
    OAuthService,
    IntegrationRepository,
    TokenValidationHelper,
    ContaAzulVendaService,
    ContaAzulPessoaService,
    ContaAzulServicoService,
    ContaAzulProdutoService,
    PrismaService,
    TokenRefreshService,
  ],
})
export class IntegrationsModule {}
