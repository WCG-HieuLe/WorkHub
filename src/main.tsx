import React from 'react'
import ReactDOM from 'react-dom/client'
import { PublicClientApplication, EventType } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { HashRouter } from 'react-router-dom'
import App from '@/App'
import { msalConfig } from '@/config/authConfig'

const msalInstance = new PublicClientApplication(msalConfig);

/**
 * Clear stale MSAL interaction state from browser storage.
 * Fixes "interaction_in_progress" errors from crashed/closed popups.
 */
function clearStaleInteractionState(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('interaction')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
}

/**
 * Initialize MSAL before React renders.
 * 1. Handle redirect response (if returning from Azure AD)
 * 2. Set active account from cache if previously logged in
 * 3. Render React app
 */
async function initializeAndRender() {
    await msalInstance.initialize();

    // Handle redirect response if present
    try {
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
            msalInstance.setActiveAccount(response.account);
        }
    } catch (err: any) {
        if (err?.errorCode !== 'no_token_request_cache_error') {
            console.warn('[MSAL] handleRedirectPromise error:', err);
        }
        clearStaleInteractionState();
    }

    // Set active account from cache if one exists
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
        msalInstance.setActiveAccount(accounts[0]);
    }

    // Listen for account changes (login/logout)
    msalInstance.addEventCallback((event) => {
        if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
            const payload = event.payload as { account?: any };
            if (payload.account) {
                msalInstance.setActiveAccount(payload.account);
            }
        }
    });

    // Render React
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(
        <React.StrictMode>
            <MsalProvider instance={msalInstance}>
                <HashRouter>
                    <App />
                </HashRouter>
            </MsalProvider>
        </React.StrictMode>,
    );
}

initializeAndRender().catch((err) => {
    console.error('[MSAL] Init failed:', err);
    // Render anyway so user can see the app
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(
        <React.StrictMode>
            <MsalProvider instance={msalInstance}>
                <HashRouter>
                    <App />
                </HashRouter>
            </MsalProvider>
        </React.StrictMode>,
    );
});
