# WorkHub

**Last Updated**: 2026-03-21

> Internal web app quản lý hệ thống, chấm công, nghỉ phép và tools nội bộ — kết nối Dataverse qua MSAL Azure AD.

---

## Tech Stack

- **Framework**: Vite 5 + React 18
- **Language**: TypeScript (strict mode)
- **Styling**: CSS custom properties (theme engine) + glassmorphism design system
- **Icons**: `lucide-react` (consolidated)
- **Auth**: `@azure/msal-browser` + `@azure/msal-react` (Azure AD popup login)
- **Data Source**: Dataverse API (`wecare-ii.crm5.dynamics.com/api/data/v9.2`)
- **State**: `zustand` (global) + `useState` (component-level)
- **Server State**: `@tanstack/react-query` v5
- **Notifications**: `sonner` (toast)
- **Routing**: `react-router-dom` v6
- **Virtualization**: `@tanstack/react-virtual`
- **Excel**: `xlsx`
- **Deploy**: GitHub Pages (base `/WorkHub/`)

## Build Commands

```bash
yarn dev            # Vite dev server
yarn build          # tsc && vite build → dist/
npx tsc --noEmit    # Type check only
```

## Environment Variables

| Variable | Required | Mô tả |
|----------|----------|--------|
| `VITE_CLIENT_ID` | ✅ | Azure AD App Registration Client ID |
| `VITE_AUTHORITY` | ❌ | Authority URL (default: `https://login.microsoftonline.com/common`) |
| `VITE_EMPLOYEE_ID` | ❌ | Default employee GUID cho dev |

## Authentication

- **Method**: MSAL popup login → Azure AD
- **Scopes**: `https://wecare-ii.crm5.dynamics.com/.default`
- **Cache**: `sessionStorage`
- **Flow**: Login → `localAccountId` → `systemuser` → `crdfd_employee` → `employeeId`

## Features

### ✅ Dashboard
- Welcome greeting (dynamic from MSAL) + date
- Stats grid (4 cards): Admin Systems, Active Tools, Pending Requests, This Month
- Quick Access links (6 cards): Power Platform, Azure, Google Admin, MS Entra, SharePoint, 365 Admin
- Design: Stitch glassmorphism — stat-card label-on-top, unique icon colors, hover-glow

### ✅ Operations (6 pages)
- **Data** — Database & storage. Tabs: Portals, Dataverse tables, Fabric. Real API: Dataverse metadata + Data
- **Reports** — PBI gallery: search, gradient thumbnails, iframe embed. Real API: Power BI REST
- **Fabric** — Microsoft Fabric (Workspace, Dataflow, Dataset, Report, Lakehouse, Settings). 🚧 Placeholder
- **Dataflow** — PowerApps dataflows status/history. 🚧 Placeholder
- **Automate Flow** — Power Automate flow list + trạng thái. 🚧 Placeholder (renamed from Scheduled Jobs)
- **Canvas App** — Canvas apps list + status. 🚧 Placeholder

### ✅ Dev Tools (1 page)
- **Tools & Links** — Portal links: Stitch, GitHub, Figma, NPM, Project-Tracker. PP management via Dataverse API: Canvas Apps, Cloud Flows. Lazy tab loading + pagination

### ✅ Settings (5 pages, renamed from System)
- **Admin** — Quản trị. Portal links: Entra, M365 Admin, Exchange
- **System Health** — Real API: MS Graph Service Health (service status, active issues)
- **Environment** — Power Platform environments. 🚧 Placeholder (moved from DevTools)
- **Domains** — Real API: MS Graph Domains
- **Backups** — Real API: BAP Admin API (environment backup info, retention). BigQuery tab 🚧 planned

### ✅ Finance (2 pages)
- **Billing** — Real API: Azure Cost Management REST API (daily costs, top resources, service breakdown)
- **License** — Real API: MS Graph `subscribedSkus` (SKU details, assigned/total seats)

### ✅ Security & Compliance (6 pages)
- **Security** — Real API: MS Graph Security (risky users, security alerts)
- **Audit Log** — Real API: MS Graph Audit Logs (directory audit). Lazy tab loading + pagination
- **Change Log** — Deployment tracking. 🚧 Placeholder (planned: GitHub API integration)
- **Sign-in Log** — Azure AD sign-in logs. 🚧 Placeholder
- **Incidents** — Security incident tracking. 🚧 Placeholder
- **Compliance** — Policy compliance. Portal links: Purview, DLP

### ✅ Personal (3 pages)
- **Timesheet** — Calendar view chấm công. Component: `Calendar.tsx`, `WorkSummary.tsx`, `DayDetail.tsx`
- **Registration** — Đăng ký nghỉ phép / điều chỉnh. Component: `LeaveDashboard.tsx`
- **Payment Request** — Placeholder
- **Reports** — PBI gallery: search, gradient thumbnails, 8 sample reports. Component: `ReportsPage.tsx`

### ✅ Cross-cutting
- **Theme Engine** — 5 backgrounds × 6 accents + custom. Persist `localStorage`
- **Sidebar** — 6 groups (Operations/Dev Tools/Settings/Finance/Security/Personal), collapsible, auto-collapse < 1280px. Headers 55% white, items 85% white. Default open: Operations + Dev Tools + Settings
- **Toast Notifications** — `sonner` replacing `alert()`
- **Error Boundary** — Catch React errors
- **Performance** — Lazy tab loading (fetch on tab click), sub-page lazy load (modal), client-side pagination (`usePagination` hook)
- **Lazy Loading** — Route-level code splitting (planned: `React.lazy`)

### Data Loading Optimization Patterns
| Pattern | Chi tiết | Áp dụng |
|---------|----------|---------|
| **Lazy tab loading** | Mỗi tab fetch data riêng khi click, cache `loadedTabs` ref để không re-fetch | DevToolsPage, LogsPage |
| **Sub-page lazy load** | Click icon → mở modal/panel → mới gọi API. Giảm load data sẵn gây trì trệ UX | DataflowPage (history), AutomateFlowPage (history) |
| **Client pagination** | 20 rows/page, `usePagination` hook, controls nằm top-right cạnh Search/Refresh | DevToolsPage, LogsPage, LicensePage, BillingPage |
| **Search filter** | Client-side filter trên data đã load, debounce không cần vì data nhỏ | DevToolsPage, LogsPage, LicensePage |
| **Portals tab** | External links gom vào tab cuối, không load API, không cần Refresh | DevToolsPage, LicensePage |
| **TanStack Query** | 🔜 Migration planned: auto cache (`staleTime`), request dedup, background refetch, retry. Thay thế manual `useState` + `useEffect` fetch | Chưa áp dụng — đã install `@tanstack/react-query` v5 |

## Design System (from Stitch)

| Token | Value |
|-------|-------|
| Background | `#09090b` + mesh gradient (violet radial glow) |
| Surface | `rgba(24,24,27,0.85)` + `backdrop-filter: blur(12px)` |
| Border | `rgba(255,255,255,0.08)` |
| Accent | Violet `#a78bfa` |
| Success/Warning/Danger | `#10b981` / `#f59e0b` / `#ef4444` |
| Font | Inter, 13px base |
| Radius | 16px panels, 12px cards, 8px buttons |
| Hover Effect | `box-shadow: 0 0 20px rgba(167,139,250,0.15)` |

## Project Structure

```
src/
├── App.tsx                    # Main router (react-router-dom v6)
├── main.tsx                   # Entry: MsalProvider wrapper
├── index.css                  # CSS monolith (~95KB) — global + component styles
├── routes/
│   └── index.ts               # 25+ routes, ROUTE_META, ROUTE_TO_MGMT_SUBVIEW
├── components/
│   ├── Header.tsx
│   ├── Sidebar.tsx            # 6-group collapsible nav (Operations/DevTools/Settings/Finance/Security/Personal)
│   ├── Dashboard.tsx          # Stats + Quick Access (Stitch design)
│   ├── ManagementView.tsx     # Sub-views (Admin, Compliance)
│   ├── PlaceholderPage.tsx    # Reusable "coming soon" with portal links
│   ├── DataPage.tsx           # Dataverse/BigQuery/Fabric data viewer
│   ├── ReportsPage.tsx        # PBI gallery with search + iframe embed
│   ├── DevToolsPage.tsx       # Portal links + PP management
│   ├── BackupsPage.tsx        # Environment backups via BAP API
│   ├── SystemHealthPage.tsx   # MS Graph Service Health
│   ├── BillingPage.tsx        # Azure Cost Management
│   ├── Calendar.tsx
│   ├── DayDetail.tsx
│   ├── WorkSummary.tsx
│   ├── LeaveDashboard.tsx     # toast notifications (sonner)
│   ├── LeaveDetailModal.tsx
│   ├── LeaveList.tsx
│   ├── LeaveStats.tsx
│   ├── AuditLogs.tsx
│   ├── Settings.tsx
│   ├── ErrorBoundary.tsx
│   ├── DataTracker/
│   └── Warehouse/
├── config/
│   └── authConfig.ts
├── services/
│   ├── dataverseService.ts    # Legacy monolith (~73KB) — pending removal
│   └── dataverse/             # Refactored modular services
├── context/
│   └── ThemeContext.tsx
├── types/
│   └── types.ts
├── hooks/
│   └── usePagination.ts      # Reusable client-side pagination
└── utils/
    ├── workUtils.ts
    ├── cacheUtils.ts
    └── performanceUtils.ts
```

## Dependencies

| Package | Mục đích |
|---------|----------|
| `react` ^18 | UI framework |
| `react-router-dom` ^6 | URL routing |
| `@azure/msal-browser` + `msal-react` | Azure AD auth |
| `lucide-react` | Icon library (consolidated) |
| `zustand` | Global state management |
| `@tanstack/react-query` v5 | Server state / data fetching |
| `sonner` | Toast notifications |
| `@tanstack/react-virtual` | Virtual scrolling |
| `xlsx` | Excel read/write |

## Known Issues

- **`dataverseService.ts` monolith** (73KB): Legacy service chưa xóa, song song với `services/dataverse/`
- **`index.css` monolith** (~95KB): CSS chưa tách modular
- **Hardcoded Dataverse URL**: `wecare-ii.crm5.dynamics.com` trong `authConfig.ts`
- **Inline CSS lints**: Dashboard/ReportsPage dùng inline styles cho dynamic icon colors (data-driven, intentional)
- **Dead code — `cacheUtils.ts`**: `CacheManager` class (in-memory TTL) — không import ở đâu. Sẽ xóa khi migrate sang TanStack Query
- **Dead code — `performanceUtils.ts`**: `debounce`, `throttle`, `batchWithDelay`, `measureApiCall` — không import ở đâu
- **TanStack Query chưa dùng**: `@tanstack/react-query` v5 đã install nhưng chưa có `useQuery` nào — đang fetch thủ công bằng `useState` + `useEffect`

## Roadmap

- [x] API integration cho Billing (Azure Cost API)
- [x] API integration cho License (MS Graph subscribedSkus)
- [x] API integration cho Reports (Power BI REST API)
- [x] Dev Tools — Canvas Apps & Flows via Dataverse API
- [x] Logs — Sign-in & Audit via MS Graph
- [x] Security — Risky users & alerts via MS Graph
- [x] Domains — MS Graph Domains API
- [x] System Health — MS Graph Service Health API
- [x] Performance: Pagination + Lazy tab loading
- [ ] Migrate sang TanStack Query (`useQuery`) — thay thế manual fetch pattern
- [ ] Route-level code splitting (`React.lazy` + `Suspense`)
- [ ] Xóa dead code: `cacheUtils.ts`, `performanceUtils.ts`
- [ ] Scheduled Jobs monitoring
- [ ] Xóa `dataverseService.ts` monolith
- [ ] Tách `index.css` → modular CSS files

## Quyết Định Thiết Kế

- **Stitch MCP cho design**: 4 screens generated (Dashboard, Dev Tools, Billing, Reports) → extract CSS tokens → apply
- **Glassmorphism design system**: Dark theme + frosted glass panels + violet accent — mesh-bg gradient, hover-glow
- **Sidebar hierarchy**: 6 groups: Operations, Dev Tools, Settings, Finance, Security & Compliance, Personal. Default: first 3 open
- **Route organization**: URLs grouped by sidebar section (`/operations/*`, `/settings/*`, `/finance/*`, etc.)
- **`lucide-react` only**: Consolidated từ `@ant-design/icons` + `lucide-react` → chỉ dùng lucide
- **`sonner` thay `alert()`**: Toast notifications cho UX tốt hơn
- **Canvas App iframe embed**: Click canvas app → mở iframe overlay trong WorkHub
- **Dataverse API cho PP**: Canvas Apps + Flows dùng Dataverse OData, Environments dùng BAP API (2 token song song)
- **Lazy tab loading**: Mỗi tab fetch data riêng khi click, cache loaded state để không re-fetch
- **Sub-page lazy load**: Click icon → modal → fetch (history). Tránh load data sẵn khi user chưa cần
- **TanStack Query migration**: Quyết định dùng `@tanstack/react-query` v5 thay vì self-built `cacheUtils.ts`. Lý do: auto cache + dedup + retry + background refetch + DevTools — `cacheUtils` chỉ giải quyết TTL cache
- **Theme engine custom**: CSS custom properties + `data-bg`/`data-accent` attributes
- **`sessionStorage` cho auth**: Token không persist cross-tab — an toàn hơn
- **Placeholder pattern**: New pages start as `PlaceholderPage` with portal links, upgraded to real pages when ready
