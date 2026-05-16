import { Configuration, PopupRequest } from '@azure/msal-browser';

// Azure AD App Registration config
// Replace with your actual Azure tenant & client IDs
export const msalConfig: Configuration = {
  auth: {
    clientId:    (import.meta as any).env?.VITE_AZURE_CLIENT_ID || 'your-azure-client-id',
    authority:   `https://login.microsoftonline.com/${(import.meta as any).env?.VITE_AZURE_TENANT_ID || 'your-tenant-id'}`,
    redirectUri: (import.meta as any).env?.VITE_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

// Login scopes — openid, profile, email + optional Graph API
export const loginRequest: PopupRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};

// Graph API endpoint to fetch manager attribute
export const graphConfig = {
  graphMeEndpoint:      'https://graph.microsoft.com/v1.0/me',
  graphManagerEndpoint: 'https://graph.microsoft.com/v1.0/me/manager',
};
