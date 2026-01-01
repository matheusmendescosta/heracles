import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/env';
import {
  OAuthProvider,
  OAuthToken,
  OAuthUserInfo,
} from '../../oauth/interfaces/oauth-provider.interface';

@Injectable()
export class ContaAzulProvider implements OAuthProvider {
  name = 'conta-azul';
  clientId: string;
  clientSecret: string;
  redirectUri: string;

  private readonly baseUrl = 'https://api-v2.contaazul.com';
  private readonly authUrl = 'https://auth.contaazul.com/login';
  private readonly tokenUrl = 'https://auth.contaazul.com/oauth2/token';
  private readonly userUrl = 'https://api-v2.contaazul.com/v1/pessoas';

  constructor(private configService: ConfigService<Env, true>) {
    this.clientId = configService.get('CONTA_AZUL_CLIENT_ID', { infer: true });
    this.clientSecret = configService.get('CONTA_AZUL_CLIENT_SECRET', {
      infer: true,
    });
    this.redirectUri = configService.get('CONTA_AZUL_REDIRECT_URI', {
      infer: true,
    });
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      scope: 'openid profile aws.cognito.signin.user.admin',
    });

    return `${this.authUrl}?${params}`;
  }

  async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    try {
      const basicAuth = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64');

      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to exchange code: ${response.statusText} - ${JSON.stringify(
            errorData,
          )}`,
        );
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 3600,
        tokenType: data.token_type || 'Bearer',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to exchange code for token: ${errorMessage}`);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthToken> {
    try {
      const basicAuth = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64');

      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to refresh token: ${response.statusText} - ${JSON.stringify(
            errorData,
          )}`,
        );
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in || 3600,
        tokenType: data.token_type || 'Bearer',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to refresh access token: ${errorMessage}`);
    }
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      const response = await fetch(this.userUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get user info: ${response.statusText} - Endpoint: ${this.userUrl}`,
        );
      }

      const body = await response.json();
      const data = body.data || body;

      return {
        id: data.id ? data.id.toString() : data.cpf || 'unknown',
        email: data.email || 'unknown',
        name: data.nome || data.name || 'Usuário Conta Azul',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get user info: ${errorMessage}`);
    }
  }
}
