import { Module } from '@nestjs/common';
import { AuthenticateController } from './authenticate-controller';
import { CreateAccountController } from './create-account.controller';
import { CreateClientController } from './create-client.controller';
import { CreateProductOptionsController } from './create-product-options.controller';
import { CreateProductController } from './create-product.controller';
import { CreateQuoteController } from './create-quote.controller';
import { CreateServiceController } from './create-service.controller';
import { CreateServicesOptionsController } from './create-services-options.controller';
import { GetQuoteController } from './get-quote.controller';
import { GetUserController } from './get-user.controller';
import { GetProductsController } from './list-products.controller';
import { ListQuoteController } from './list-quotes.controller';
import { GetServicesController } from './list-services.controller';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsModule } from '../modules/integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  controllers: [
    AuthenticateController,
    CreateAccountController,
    CreateClientController,
    CreateProductController,
    CreateProductOptionsController,
    CreateServiceController,
    CreateServicesOptionsController,
    CreateQuoteController,
    ListQuoteController,
    GetServicesController,
    GetProductsController,
    GetUserController,
    GetQuoteController,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class ControllersModule {}
