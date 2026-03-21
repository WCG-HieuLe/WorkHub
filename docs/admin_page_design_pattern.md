# WorkHub Admin Page — Design Pattern

> Template chuẩn cho tất cả admin/management pages trong WorkHub.

## Layout Structure (top → bottom)

```
┌─────────────────────────────────────────────────┐
│  [Stat Card 1]  [Stat Card 2]  [Stat Card 3]   │  ← 3-4 cards, horizontal row
├─────────────────────────────────────────────────┤
│  [Tab1] [Tab2] [Tab3] [Portals]    < 1/5 > 🔍 ↻│  ← Tabs left, pagination + search + refresh right
├─────────────────────────────────────────────────┤
│  Data Table (scrollable, ~50 rows)              │  ← Compact rows, status badges
│  ...                                            │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

## Key UX Rules

| Rule | Detail |
|------|--------|
| **Rows per page** | 20 (scrollable), tăng lên nếu cần |
| **Pagination vị trí** | **Top-right**, cạnh Search + Refresh — KHÔNG để dưới bảng |
| **Lazy tab loading** | Chỉ fetch data khi click tab, cache loaded state |
| **Tab cuối = Portals** | External links gom vào tab riêng, không để dưới cùng |
| **Search/Pagination** | Chỉ hiện ở data tabs (ẩn ở Portals/static tabs) |
| **Compact margins** | Minimal spacing giữa sections |

## Stat Cards

- Label on top (small, muted)
- Large number value below
- Icon badge top-right (colored circle background + Lucide icon)
- Colors: Purple `#8b5cf6`, Green `#10b981`, Blue `#3b82f6`, Amber `#f59e0b`

## Tab Bar

- Active tab: violet border-bottom + background highlight
- Right actions area: `[< 1/5 >]` `[🔍 Filter]` `[↻]`
- Pagination compact: chỉ icon chevron + page/total

## Data Table

- Semi-transparent rows on dark background
- Hover: subtle violet glow `rgba(167,139,250,0.05)`
- Status badges: colored pills (green success, amber warning, red error)
- Date format: `vi-VN` locale
- No row borders — clean separator via alternating opacity

## Portal Cards (tab cuối)

- 3-column grid
- Each card: Icon + Title + Description + External link arrow
- Glassmorphism border + hover glow

## CSS Tokens Reference

| Token | Value |
|-------|-------|
| Background | `#09090b` |
| Surface | `rgba(24,24,27,0.85)` + `blur(12px)` |
| Border | `rgba(255,255,255,0.08)` |
| Accent | `#a78bfa` (violet) |
| Font | Inter, 13px base |
| Card radius | 12px |
| Button radius | 8px |
| Hover glow | `box-shadow: 0 0 20px rgba(167,139,250,0.15)` |

## CSS Classes (existing)

| Class | Usage |
|-------|-------|
| `.health-page` | Page wrapper |
| `.billing-stats` | Stat cards container (flex row) |
| `.billing-stat-card` | Individual stat card |
| `.logs-tabs` / `.logs-tab` | Tab bar |
| `.reports-header` | Tab bar + actions row |
| `.reports-header-actions` | Right-side controls container |
| `.pagination-bar` | Inline pagination (`< 1/5 >`) |
| `.billing-table` | Data table |
| `.billing-section` | Content section wrapper |
| `.management-grid` / `.management-card` | Portal link cards |
| `.license-status-badge` | Colored status pill |

## Stitch Prompt Template

```
Admin dashboard page called '[PAGE_NAME]' for [PURPOSE].
Dark theme with glassmorphism panels (#09090b background, frosted glass cards with blur).

Layout:
- Top: [N] stat cards in horizontal row — [Card1] ([color] icon), [Card2]...
  Each card: label on top, large number below, colored icon badge top-right.
- Tab bar with [N] tabs — [Tab1], [Tab2], ..., Portals.
  Active tab violet highlight. Right side: compact < 1/5 > pagination, search input, refresh button.
- Data table: semi-transparent rows, hover glow, 50 rows scrollable.
  Status badges as colored pills (green/amber/red).
- Portals tab: [N] link cards in grid with icon, title, description, external arrow.

Tokens: Inter 13px, violet #a78bfa, border rgba(255,255,255,0.08),
radius 12px cards / 8px buttons, hover glow violet 0.15 opacity.
No device frames. Desktop layout. No sidebar.
```

## Row Detail Pattern: Right Sidebar

Click bất kỳ row nào → slide-in panel từ phải, hiển thị full metadata + related data.

| Element | Detail |
|---------|--------|
| **Trigger** | Click row (`cursor: pointer`, highlight on hover) |
| **Panel width** | 420px, slide-in animation 0.2s |
| **Overlay** | Dark overlay, click to close |
| **Header** | Title + X close button |
| **Body** | Scrollable, 3 sections: Metadata Grid → Related Items → Users |
| **Lazy fetch** | Detail data fetched on click, loading spinner in panel |

### CSS Classes
| Class | Usage |
|-------|-------|
| `.detail-sidebar-overlay` | Dark backdrop |
| `.detail-sidebar` | Fixed right panel |
| `.detail-sidebar-header` | Title + close |
| `.detail-sidebar-body` | Scrollable content |
| `.detail-section` / `.detail-section-title` | Section grouping |
| `.detail-meta-grid` / `.detail-meta-item` | 2-col metadata grid |
| `.detail-user-list` / `.detail-user-item` | User list with avatar |
| `.detail-plan-list` / `.detail-plan-badge` | Tag/badge list |

## Data Cache Pattern: Module-Level Cache

Persist data across route navigations, tránh re-fetch API tốn thời gian (Azure Cost, MS Graph).

| Element | Detail |
|---------|--------|
| **File** | `services/azure/[name]Cache.ts` |
| **TTL** | 10 phút (configurable) |
| **Scope** | Module-level (survives navigation, clears on page reload) |
| **Init state** | `useState(() => getCachedData())` |
| **Save** | `setCachedData(data)` sau fetch thành công |
| **Force refresh** | `clearCache()` → fetch mới |
| **loadedRef** | Init `useRef(!!getCachedData())` để skip fetch nếu có cache |

### Template
```typescript
const CACHE_TTL = 10 * 60 * 1000;
const cache = { data: null, lastFetched: null };

export function getCached[Name]Data() {
    if (!cache.data || Date.now() - cache.lastFetched > CACHE_TTL) return null;
    return cache.data;
}
export function setCached[Name]Data(data) { cache.data = data; cache.lastFetched = Date.now(); }
export function clear[Name]Cache() { cache.data = null; cache.lastFetched = null; }
```

## Implementation Checklist (new page)

1. Create service file: `services/azure/[name]Service.ts`
2. Create page component: `components/[Name]Page.tsx`
3. Import `usePagination` from `@/hooks/usePagination`
4. Use `loadedTabs` ref pattern for lazy loading
5. Copy stat cards + tab bar + table structure from DevToolsPage
6. Add route in `routes/index.ts`
7. Portals as last tab (static, no refresh)
