export const CASDOOR_CONFIG = {
  serverUrl: process.env.NEXT_PUBLIC_CASDOOR_SERVER_URL || "",
  clientId: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID || "",
  clientSecret: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_SECRET || "",
  appName: process.env.NEXT_PUBLIC_CASDOOR_APP_NAME || "",
  organizationName: process.env.NEXT_PUBLIC_CASDOOR_ORG_NAME || "",
  redirectPath: process.env.NEXT_PUBLIC_CASDOOR_REDIRECT_PATH || "/callback",
};

export const ADMIN_EMAILS: string[] = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || "admin@example.com"
).split(",").map(e => e.trim());
