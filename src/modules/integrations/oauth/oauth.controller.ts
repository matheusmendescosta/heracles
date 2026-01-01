import {
  Controller,
  Get,
  Query,
  Redirect,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';
import { CurrentUser } from 'src/auth/current-user-decorator';
import { userPayload } from 'src/auth/jwt.strategy';
import { v4 as uuidv4 } from 'uuid';

@Controller('integrations/oauth')
export class OAuthController {
  constructor(private oauthService: OAuthService) {}

  @Get('authorize')
  authorize(@Query('provider') provider: string) {
    if (!provider) {
      throw new BadRequestException('Provider is required');
    }

    const state = uuidv4();
    const authorizationUrl = this.oauthService.getAuthorizationUrl(
      provider,
      state,
    );

    return {
      authorizationUrl,
      message: 'Copy the URL below and paste in your browser',
    };
  }

  @Get('callback')
  @UseGuards(AuthGuard('jwt'))
  async callback(
    @Query('provider') provider: string,
    @Query('code') code: string,
    @CurrentUser() user: userPayload,
  ) {
    if (!provider || !code) {
      throw new BadRequestException('Provider and code are required');
    }

    try {
      const token = await this.oauthService.exchangeCodeForToken(
        provider,
        code,
      );

      const integration = await this.oauthService.saveIntegration(
        user.sub,
        provider,
        token.accessToken,
        token.refreshToken,
        token.expiresIn,
      );

      return {
        success: true,
        message: `Integration with ${provider} completed successfully`,
        integrationId: integration.id,
        providerUserId: integration.providerUserId,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to integrate with ${provider}: `);
    }
  }

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  async getIntegrationStatus(
    @Query('provider') provider: string,
    @CurrentUser() user: userPayload,
  ) {
    if (!provider) {
      throw new BadRequestException('Provider is required');
    }

    const integration = await this.oauthService.getActiveIntegration(
      user.sub,
      provider,
    );

    if (!integration) {
      return {
        connected: false,
        provider,
      };
    }

    return {
      connected: integration.isActive,
      provider,
      providerUserId: integration.providerUserId,
      connectedAt: integration.createdAt,
      lastUpdated: integration.updatedAt,
    };
  }
}
