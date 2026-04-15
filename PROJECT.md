# WorkHub

**Last Updated**: 2026-04-14
**Last Reviewed**: 2026-04-14

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
- **Server State**: Unified hook `useApiData` 
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

### ✅ Operations
- **Data** — Database & storage. Tabs: Portals, Dataverse tables, Fabric. Real API: Dataverse metadata + Data
- **Reports** — PBI gallery: search, gradient thumbnails, iframe embed. Real API: Power BI REST
- **Fabric** — Microsoft Fabric (Workspace, Dataflow, Dataset, Report, Lakehouse, Settings). 
- **Dataflow** — PowerApps dataflows status/history. 
- **Automate Flow** — Power Automate flow list. Tích hợp Lightweight Health Check quét >700 flows trong ~20s để tìm Failed & Stuck runs.
- **Canvas App** — Canvas apps list + status. 
- **Connections** - Power Platform Connections Management (ConnectionsPage)

### ✅ Dev Tools
- **Tools & Links** — Portal links: Stitch, GitHub, Figma, NPM, Project-Tracker. PP management via Dataverse API.

### ✅ Settings
- **Admin** — Quản trị. Portal links: Entra, M365 Admin, Exchange
- **System Health** — Real API: MS Graph Service Health (service status, active issues)
- **Environment** — Power Platform environments. 
- **Domains** — Real API: MS Graph Domains
- **Backups** — Real API: BAP Admin API (environment backup info, retention). 

### ✅ Finance (2 pages)
- **Billing** — Real API: Azure Cost Management REST API (daily costs, top resources, service breakdown)
- **License** — Real API: MS Graph `subscribedSkus` (SKU details, assigned/total seats)

### ✅ Security & Compliance
- **Security** — Real API: MS Graph Security (risky users, security alerts)
- **Logs** — Sign-in & Audit Logs MS Graph
- **Compliance** — Policy compliance.

### ✅ Personal
- **Timesheet** — Calendar view chấm công. 
- **Registration** — Đăng ký nghỉ phép / điều chỉnh. 
- **Reports** — PBI gallery.

### Tối ưu hóa Data Loading
- **Global Caching (Pattern A)**: Mặc định sử dụng hook `useApiData` cho data < 5k.
- **Cursor Paging (Pattern B)**: Dành cho Big Data (>5k), lưu memory dạng page history.
- **Lightweight API Fetch**: dùng `$top=100` giúp tốc độ scan nhanh hơn gấp 10 lần.

## Design System (from Stitch)

- Background: `#09090b` + mesh gradient (violet radial glow)
- Surface: rgba(24,24,27,0.85)` + `backdrop-filter: blur(12px)
- H1-H3: Lexend. Body: Inter. Accent: `#a78bfa`

## Structure Highlights

- `src/index.css`: Toàn bộ styling biến số (theme engine).
- `src/components/`: File layout, các components ghép từ Fragment của UI.
- `src/hooks/useApiData.ts`: Central fetch engine.
- Mọi logic chọc Dataverse nên xài `useApiData` thay vì tự gọi `fetch` qua useEffect.

## Roadmap & Known Issues
- `dataverseService.ts` vẫn là file legacy lớn (73KB) chưa được tháo dỡ hoàn toàn.
- `index.css` (~95KB) nguyên khối.
- [x] Đã hoàn thành đa số việc đấu nối API cho các phân hệ Cost Management, Flows, MS Graph, v.v.
- [ ] Vẫn cần cleanup bớt code dư để tối ưu build/caching.
