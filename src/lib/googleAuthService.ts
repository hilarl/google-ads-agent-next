// lib/googleAuthService.ts
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import axios from 'axios';

export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface GoogleAdsCustomer {
  resourceName: string;
  id: string;
  descriptiveName: string;
  currencyCode: string;
  timeZone: string;
  trackingUrlTemplate?: string;
  manager: boolean;
  testAccount: boolean;
  autoTaggingEnabled: boolean;
}

export interface GoogleAdsAccountHierarchy {
  customerClient: GoogleAdsCustomer;
  level: number;
  manager: boolean;
  children: GoogleAdsAccountHierarchy[];
}

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;
  private readonly SCOPES = [
    'openid',
    'profile', 
    'email',
    'https://www.googleapis.com/auth/adwords' // Google Ads API scope
  ];

  constructor(
    private clientId: string,
    private clientSecret: string,
    private redirectUri: string
  ) {
    this.oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  /**
   * Generate OAuth 2.0 authorization URL for Google sign-in
   */
  generateAuthUrl(): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required for refresh token
      scope: this.SCOPES,
      include_granted_scopes: true,
      prompt: 'consent', // Force consent screen to ensure refresh token
      state: this.generateStateToken() // CSRF protection
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      if (!tokens.refresh_token) {
        throw new Error('No refresh token received. User may need to revoke app access and re-authenticate.');
      }

      this.oauth2Client.setCredentials(tokens);

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token!,
        expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        token_type: tokens.token_type || 'Bearer',
        scope: tokens.scope || this.SCOPES.join(' '),
        id_token: tokens.id_token ?? undefined
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(`Failed to exchange authorization code: ${error}`);
    }
  }

  /**
   * Get user profile information using access token
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw new Error(`Failed to fetch user information: ${error}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokens> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      return {
        access_token: credentials.access_token!,
        refresh_token: refreshToken, // Refresh token typically remains the same
        expires_in: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600,
        token_type: credentials.token_type || 'Bearer',
        scope: credentials.scope || this.SCOPES.join(' ')
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error(`Failed to refresh access token: ${error}`);
    }
  }

  /**
   * List accessible Google Ads customers
   */
  async listAccessibleCustomers(accessToken: string, developerToken: string): Promise<GoogleAdsCustomer[]> {
    try {
      const response = await axios.get(
        'https://googleads.googleapis.com/v21/customers:listAccessibleCustomers',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.resourceNames) {
        return [];
      }

      // Extract customer IDs and fetch details
      const customerIds = response.data.resourceNames.map((resourceName: string) => {
        const parts = resourceName.split('/');
        return parts[parts.length - 1];
      });

      // Fetch customer details for each customer
      const customers: GoogleAdsCustomer[] = [];
      
      for (const customerId of customerIds) {
        try {
          const customerDetails = await this.getCustomerDetails(accessToken, developerToken, customerId);
          if (customerDetails) {
            customers.push(customerDetails);
          }
        } catch (error) {
          console.warn(`Failed to fetch details for customer ${customerId}:`, error);
          // Add basic customer info even if details fail
          customers.push({
            resourceName: `customers/${customerId}`,
            id: customerId,
            descriptiveName: `Customer ${customerId}`,
            currencyCode: 'USD',
            timeZone: 'UTC',
            manager: false,
            testAccount: false,
            autoTaggingEnabled: false
          });
        }
      }

      return customers;
    } catch (error) {
      console.error('Error listing accessible customers:', error);
      throw new Error(`Failed to list accessible customers: ${error}`);
    }
  }

  /**
   * Get detailed customer information
   */
  async getCustomerDetails(
    accessToken: string, 
    developerToken: string, 
    customerId: string,
    loginCustomerId?: string
  ): Promise<GoogleAdsCustomer | null> {
    try {
      const query = `
        SELECT 
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          customer.tracking_url_template,
          customer.manager,
          customer.test_account,
          customer.auto_tagging_enabled
        FROM customer
        LIMIT 1
      `;

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json'
      };

      // Add login-customer-id if provided (required for manager accounts)
      if (loginCustomerId) {
        headers['login-customer-id'] = loginCustomerId;
      }

      const response = await axios.post(
        `https://googleads.googleapis.com/v21/customers/${customerId}/googleAds:search`,
        { query },
        { headers }
      );

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const customer = result.customer;

        return {
          resourceName: `customers/${customerId}`,
          id: customer.id || customerId,
          descriptiveName: customer.descriptiveName || `Customer ${customerId}`,
          currencyCode: customer.currencyCode || 'USD',
          timeZone: customer.timeZone || 'UTC',
          trackingUrlTemplate: customer.trackingUrlTemplate,
          manager: customer.manager || false,
          testAccount: customer.testAccount || false,
          autoTaggingEnabled: customer.autoTaggingEnabled || false
        };
      }

      return null;
    } catch (error) {
      console.error(`Error fetching customer details for ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Get account hierarchy for manager accounts
   */
  async getAccountHierarchy(
    accessToken: string,
    developerToken: string,
    managerCustomerId: string
  ): Promise<GoogleAdsAccountHierarchy[]> {
    try {
      const query = `
        SELECT 
          customer_client.client_customer,
          customer_client.level,
          customer_client.manager,
          customer_client.descriptive_name,
          customer_client.currency_code,
          customer_client.time_zone,
          customer_client.id
        FROM customer_client 
        WHERE customer_client.level <= 2
        ORDER BY customer_client.level, customer_client.descriptive_name
      `;

      const response = await axios.post(
        `https://googleads.googleapis.com/v21/customers/${managerCustomerId}/googleAds:search`,
        { query },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'login-customer-id': managerCustomerId,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.results) {
        return [];
      }

      const hierarchy: Map<string, GoogleAdsAccountHierarchy> = new Map();
      
      // Build hierarchy structure
      for (const result of response.data.results) {
        const customerClient = result.customerClient;
        const clientId = this.extractCustomerIdFromResourceName(customerClient.clientCustomer);
        
        const accountNode: GoogleAdsAccountHierarchy = {
          customerClient: {
            resourceName: customerClient.clientCustomer,
            id: clientId,
            descriptiveName: customerClient.descriptiveName,
            currencyCode: customerClient.currencyCode,
            timeZone: customerClient.timeZone,
            manager: customerClient.manager,
            testAccount: false, // Not available in customer_client resource
            autoTaggingEnabled: false // Not available in customer_client resource
          },
          level: customerClient.level,
          manager: customerClient.manager,
          children: []
        };

        hierarchy.set(clientId, accountNode);
      }

      // Organize into parent-child relationships
      const rootAccounts: GoogleAdsAccountHierarchy[] = [];
      
      hierarchy.forEach((account) => {
        if (account.level === 0) {
          rootAccounts.push(account);
        } else {
          // Find parent and add as child
          const parentId = this.findParentAccount(hierarchy, account);
          if (parentId && hierarchy.has(parentId)) {
            hierarchy.get(parentId)!.children.push(account);
          }
        }
      });

      return Array.from(hierarchy.values()).filter(account => account.level === 0 || account.level === 1);
    } catch (error) {
      console.error('Error fetching account hierarchy:', error);
      throw new Error(`Failed to fetch account hierarchy: ${error}`);
    }
  }

  /**
   * Validate if user has Google Ads access
   */
  async validateGoogleAdsAccess(accessToken: string, developerToken: string): Promise<boolean> {
    try {
      const customers = await this.listAccessibleCustomers(accessToken, developerToken);
      return customers.length > 0;
    } catch (error) {
      console.error('Error validating Google Ads access:', error);
      return false;
    }
  }

  /**
   * Revoke user tokens
   */
  async revokeTokens(accessToken: string): Promise<boolean> {
    try {
      await axios.post(`https://oauth2.googleapis.com/revoke?token=${accessToken}`);
      return true;
    } catch (error) {
      console.error('Error revoking tokens:', error);
      return false;
    }
  }

  // Private helper methods
  private generateStateToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private extractCustomerIdFromResourceName(resourceName: string): string {
    const parts = resourceName.split('/');
    return parts[parts.length - 1];
  }

  private findParentAccount(hierarchy: Map<string, GoogleAdsAccountHierarchy>, account: GoogleAdsAccountHierarchy): string | null {
    // In a real implementation, you'd need to track parent-child relationships
    // This is a simplified version - you may need to make additional API calls
    // to get the complete hierarchy structure
    return null;
  }
}