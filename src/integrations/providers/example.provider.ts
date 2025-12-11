import { Injectable } from '@nestjs/common';
import {
  OAuthProvider,
  OAuthToken,
  OAuthUserInfo,
} from '../oauth/interfaces/oauth-provider.interface';

@Injectable()
export class ExampleProvider implements OAuthProvider {
  name = 'example';
  clientId: string;
  clientSecret: string;
  redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: 'read write',
      redirect_uri: this.redirectUri,
      state,
    });

    return `https://example.com/oauth/authorize?${params}`;
  }

  async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    const response = await fetch('https://example.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthToken> {
    const response = await fetch('https://example.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch('https://example.com/api/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      email: data.email,
      name: data.name,
    };
  }
}
