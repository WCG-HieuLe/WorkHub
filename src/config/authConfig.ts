// MSAL Configuration for Admin_WECARE (single tenant)
// Supports multiple API scopes: Dataverse, Azure Management, MS Graph, Power BI

export const msalConfig = {
    auth: {
        clientId: import.meta.env.VITE_CLIENT_ID || "",
        authority: import.meta.env.VITE_AUTHORITY || "https://login.microsoftonline.com/common",
    },
    cache: {
        cacheLocation: "sessionStorage" as const,
        storeAuthStateInCookie: false,
    },
};

// ── API Configurations ──

export const dataverseConfig = {
    baseUrl: import.meta.env.VITE_DATAVERSE_URL || "https://wecare-ii.crm5.dynamics.com/api/data/v9.2",
    scopes: ["https://wecare-ii.crm5.dynamics.com/.default"],
};

export const azureManagementConfig = {
    baseUrl: "https://management.azure.com",
    scopes: ["https://management.azure.com/.default"],
};

export const graphConfig = {
    baseUrl: "https://graph.microsoft.com/v1.0",
    scopes: ["https://graph.microsoft.com/.default"],
};

export const powerBIConfig = {
    baseUrl: "https://api.powerbi.com/v1.0/myorg",
    scopes: ["https://analysis.windows.net/powerbi/api/.default"],
};

export const powerAppsConfig = {
    baseUrl: "https://api.powerapps.com",
    scopes: ["https://service.powerapps.com/User"],
};

export const powerAutomateConfig = {
    baseUrl: "https://api.flow.microsoft.com",
    scopes: ["https://service.flow.microsoft.com/Flows.Read.All"],
};

export const powerPlatformAdminConfig = {
    baseUrl: "https://api.bap.microsoft.com",
    scopes: ["https://service.powerapps.com/User"],
};

// Tên nhân viên để filter
export const EMPLOYEE_NAME = "Lê Hoàng Hiếu";
export const EMPLOYEE_ID = import.meta.env.VITE_EMPLOYEE_ID || "";

