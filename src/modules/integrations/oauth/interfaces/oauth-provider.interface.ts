export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name?: string;
}

export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;

  getAuthorizationUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<OAuthToken>;
  refreshAccessToken(refreshToken: string): Promise<OAuthToken>;
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
}
