/**
 * Token service for multi-API MSAL authentication
 * Supports acquiring tokens for different API scopes
 */

import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";

/**
 * Acquire token silently for a specific API scope
 * Falls back to popup if silent fails
 */
export async function acquireToken(
    instance: IPublicClientApplication,
    account: AccountInfo,
    scopes: string[]
): Promise<string> {
    try {
        const response = await instance.acquireTokenSilent({
            scopes,
            account,
        });
        return response.accessToken;
    } catch {
        // Silent failed — try popup
        const response = await instance.acquireTokenPopup({
            scopes,
        });
        return response.accessToken;
    }
}
