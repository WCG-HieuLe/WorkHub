---
trigger: always_on
---

PROJECT TECH STACK & CODEBASE RULES

1. Công nghệ cốt lõi (Core Stack)
   - Framework: Vite + React.
   - Language: JavaScript/TypeScript (ưu tiên TypeScript nếu có `tsconfig.json`).
   - Styling: BẮT BUỘC sử dụng Tailwind CSS. Không sử dụng CSS modules hoặc Styled Components trừ khi có yêu cầu đặc biệt.
   - Icons: Sử dụng `lucide-react`.

2. Quy chuẩn Component & Code Style
   - Functional Only: Chỉ sử dụng Functional Components và Hooks. Tuyệt đối KHÔNG dùng Class Components.
   - Naming:
     - Component: `PascalCase` (VD: `UserProfile.jsx`).
     - Function/Variable: `camelCase` (VD: `handleSubmit`).
   - Imports: Sử dụng absolute imports (VD: `@/components/ui/Button`) thay vì relative imports sâu (VD: `../../../Button`).

3. Quy ước UI & Design Tokens [1]
   - Font family: Inter.
   - Base font size: 12px.
   - Heading size: 20px.
   - Override: Các giá trị này là mặc định, chỉ thay đổi khi có yêu cầu cụ thể từ thiết kế mới.

4. Cấu trúc Codebase (Project Structure)
   - `src/components/ui/`: Chứa các atomic components tái sử dụng (Button, Input, Card).
   - `src/components/`: Chứa các component nghiệp vụ phức tạp.
   - `src/pages/`: Chứa các trang (Routes).
   - `src/hooks/`: Chứa custom hooks (VD: `useAuth`, `useFetch`).
   - `src/lib/utils.js`: Chứa hàm tiện ích, bắt buộc có hàm `cn` (kết hợp `clsx` và `tailwind-merge`) để xử lý class Tailwind động.

5. State Management
   - Ưu tiên sử dụng React Context hoặc Zustand cho global state.
   - Tránh đẩy quá nhiều logic vào `useEffect`, ưu tiên xử lý trong Event Handlers.