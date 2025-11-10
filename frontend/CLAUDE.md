# Kanban Frontend - React/TypeScript Development Standards

## Technology Stack

- **React**: 19.x
- **TypeScript**: 5.3+
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.4+
- **State Management**: React hooks + Context API
- **HTTP Client**: Fetch API / Axios

## Design Reference

- **Visual + Motion System**: 모든 UI/애니메이션 작업 전에 `frontend/DESIGN.md` 를 확인하세요. 색상, 글래스 스타일, 라우트/모달/패널/드롭다운 전환 토큰(`--page-transition-duration`, `--modal-transition-duration`, 등)과 전용 유틸 클래스(`page-transition-*`, `modal-overlay-*`, `panel-slide-*`, `dropdown-panel-*`)가 정의되어 있습니다.
- 새로운 컴포넌트나 인터랙션을 추가할 때는 해당 문서에 있는 토큰/패턴을 재사용하고, 필요한 경우 먼저 `DESIGN.md` 와 `src/index.css` 에 토큰을 추가한 뒤 컴포넌트에서 참조합니다.
- `prefers-reduced-motion` 을 지원하기 위해 기존 `useModalAnimation`, `usePresenceTransition`, `usePrefersReducedMotion` 훅을 활용하고, 모션 규칙을 따릅니다.

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── common/         # Shared UI components
│   │   ├── board/          # Board-specific components
│   │   └── card/           # Card-specific components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React context providers
│   ├── services/           # API service layer
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/                 # Static assets
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Coding Standards

### 1. Component Structure

#### Functional Components
```tsx
import { FC, useState } from 'react';

interface BoardCardProps {
  title: string;
  description?: string;
  onEdit?: (id: string) => void;
}

export const BoardCard: FC<BoardCardProps> = ({ title, description, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit('card-id');
    }
  };

  return (
    <div
      className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 text-gray-600">{description}</p>}
      {isHovered && (
        <button
          onClick={handleEdit}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Edit
        </button>
      )}
    </div>
  );
};
```

**Standards**:
- Use functional components with hooks
- Export named components (not default)
- Define props interface above component
- Use `FC<PropsType>` type annotation
- Destructure props in parameters
- Use PascalCase for component names

### 2. Custom Hooks

```tsx
import { useState, useEffect } from 'react';
import { boardService } from '@/services/boardService';
import { Board } from '@/types/board';

export const useBoards = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoading(true);
        const data = await boardService.getAll();
        setBoards(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  const createBoard = async (name: string) => {
    const newBoard = await boardService.create({ name });
    setBoards([...boards, newBoard]);
    return newBoard;
  };

  return { boards, loading, error, createBoard };
};
```

**Standards**:
- Prefix hook names with `use`
- Return object for multiple values
- Handle loading and error states
- Include cleanup in useEffect when needed
- Type all return values

### 3. Service Layer

```tsx
import axios from 'axios';
import { Board, CreateBoardRequest } from '@/types/board';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class BoardService {
  private baseUrl = `${API_BASE_URL}/boards`;

  async getAll(): Promise<Board[]> {
    const response = await axios.get<Board[]>(this.baseUrl);
    return response.data;
  }

  async getById(id: string): Promise<Board> {
    const response = await axios.get<Board>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(data: CreateBoardRequest): Promise<Board> {
    const response = await axios.post<Board>(this.baseUrl, data);
    return response.data;
  }

  async update(id: string, data: Partial<Board>): Promise<Board> {
    const response = await axios.put<Board>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/${id}`);
  }
}

export const boardService = new BoardService();
```

**Standards**:
- Centralize API calls in service classes
- Use axios for HTTP requests
- Type all request and response data
- Export singleton instance
- Use environment variables for configuration

### 4. Type Definitions

```tsx
// src/types/board.ts
export interface Board {
  id: string;
  name: string;
  description?: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  cards: Card[];
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  order: number;
  assignee?: string;
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
}

export type UpdateBoardRequest = Partial<CreateBoardRequest>;
```

**Standards**:
- Define interfaces for all data structures
- Use optional properties with `?`
- Separate request/response types
- Group related types in same file
- Export all types

### 5. Context and State Management

```tsx
import { createContext, useContext, useState, FC, ReactNode } from 'react';
import { Board } from '@/types/board';

interface BoardContextType {
  selectedBoard: Board | null;
  setSelectedBoard: (board: Board | null) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

interface BoardProviderProps {
  children: ReactNode;
}

export const BoardProvider: FC<BoardProviderProps> = ({ children }) => {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  return (
    <BoardContext.Provider value={{ selectedBoard, setSelectedBoard }}>
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within BoardProvider');
  }
  return context;
};
```

**Standards**:
- Use Context API for global state
- Create custom hook for context consumption
- Throw error if used outside provider
- Type context value
- Keep state close to where it's used

### 6. Styling with Tailwind

```tsx
import { FC } from 'react';
import { cn } from '@/utils/classNames';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
}) => {
  const baseStyles = 'font-semibold rounded transition-colors focus:outline-none focus:ring-2';

  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

**Standards**:
- Use Tailwind utility classes
- Create reusable component variants
- Use `cn()` utility for conditional classes
- Follow mobile-first responsive design
- Keep styles colocated with components

### 7. Error Handling

```tsx
import { FC, Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
            <p className="mt-2 text-gray-600">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Standards**:
- Use Error Boundaries for component errors
- Show user-friendly error messages
- Log errors for debugging
- Provide fallback UI
- Handle async errors in components

### 8. Testing Standards

#### Component Tests
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

**Standards**:
- Use React Testing Library
- Test behavior, not implementation
- Use meaningful test descriptions
- Cover edge cases
- Mock external dependencies

## Best Practices

### 1. Performance Optimization

```tsx
import { memo, useMemo, useCallback } from 'react';

export const ExpensiveComponent = memo<Props>(({ data, onUpdate }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransform(item));
  }, [data]);

  // Memoize callbacks to prevent re-renders
  const handleUpdate = useCallback((id: string) => {
    onUpdate(id);
  }, [onUpdate]);

  return <div>{/* render */}</div>;
});
```

**Techniques**:
- Use `memo()` for expensive components
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for stable function references
- Implement code splitting with `lazy()`
- Optimize bundle size

### 2. Accessibility

```tsx
export const AccessibleModal: FC = () => {
  return (
    <div
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title">Modal Title</h2>
      <p id="modal-description">Modal description</p>
      <button aria-label="Close modal">×</button>
    </div>
  );
};
```

**Standards**:
- Use semantic HTML elements
- Add ARIA labels and roles
- Ensure keyboard navigation
- Maintain focus management
- Test with screen readers

### 3. Code Organization

```
components/
├── common/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   └── Input/
│       ├── Input.tsx
│       ├── Input.test.tsx
│       └── index.ts
```

**Standards**:
- Group related files in folders
- Include tests next to components
- Use barrel exports (index.ts)
- Keep files small and focused
- Follow consistent naming

### 4. Environment Variables

```tsx
// vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Usage
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

**Standards**:
- Prefix with `VITE_`
- Type environment variables
- Use `.env.local` for local overrides
- Never commit sensitive values
- Provide defaults

## Code Review Checklist

- [ ] Components follow naming conventions
- [ ] Props are properly typed
- [ ] Custom hooks used appropriately
- [ ] Error handling implemented
- [ ] Accessibility standards met
- [ ] Tests written and passing
- [ ] No console logs in production code
- [ ] Performance optimizations applied
- [ ] Responsive design implemented
- [ ] Code is DRY and maintainable

## Development Workflow

### Running the Project
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint
```

### Git Workflow
- Create feature branch from `develop`
- Write code following standards
- Write tests for new features
- Run linter and fix issues
- Commit with conventional commits
- Create PR for review
- Merge after approval

## Troubleshooting

### Common Issues

1. **Module not found errors**: Check import paths and aliases
2. **Tailwind classes not working**: Verify tailwind.config.js content paths
3. **TypeScript errors**: Check tsconfig.json and type definitions
4. **API errors**: Verify proxy configuration in vite.config.ts
5. **Hot reload not working**: Restart dev server

### Debug Tips
- Use React DevTools for component debugging
- Use browser Network tab for API debugging
- Check console for errors and warnings
- Use TypeScript strict mode
- Enable source maps in production for debugging
