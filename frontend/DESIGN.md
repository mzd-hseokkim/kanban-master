# Kanban Board - Design System

## Overview

쿨한 파스텔톤 색상과 Glassmorphism 스타일을 기반으로 한 모던 디자인 시스템입니다.

## Design Philosophy

### Core Principles

1. **Minimalism** - 깔끔하고 단순한 인터페이스
2. **Glassmorphism** - 반투명하고 부드러운 느낌
3. **Cool Pastel Tones** - 차분하고 편안한 색상
4. **Smooth Transitions** - 자연스러운 애니메이션
5. **Accessibility** - 모든 사용자를 위한 접근성

## Color Palette

### Pastel Cool Colors

#### Primary - Pastel Blue
```css
pastel-blue-50:  #f0f7ff  /* Lightest */
pastel-blue-100: #e0efff
pastel-blue-200: #b9ddff
pastel-blue-300: #7cc0ff  /* Main light */
pastel-blue-400: #3da2ff
pastel-blue-500: #0e7fff  /* Primary */
pastel-blue-600: #0066dd
pastel-blue-700: #0052b3
pastel-blue-800: #004494
pastel-blue-900: #00387a  /* Darkest */
```

#### Secondary - Pastel Purple
```css
pastel-purple-50:  #f8f5ff
pastel-purple-100: #f0ebff
pastel-purple-200: #e3d9ff
pastel-purple-300: #cabdff  /* Main light */
pastel-purple-400: #aa94ff
pastel-purple-500: #8b6cff  /* Primary */
pastel-purple-600: #7047f7
pastel-purple-700: #5e34e0
pastel-purple-800: #4e2bbb
pastel-purple-900: #412699
```

#### Accent - Pastel Cyan
```css
pastel-cyan-50:  #f0fdff
pastel-cyan-100: #dbf8ff
pastel-cyan-200: #bef2ff
pastel-cyan-300: #8de9ff  /* Main light */
pastel-cyan-400: #54d8ff
pastel-cyan-500: #2abeff  /* Primary */
pastel-cyan-600: #1a9df5
pastel-cyan-700: #1a7ed4
pastel-cyan-800: #1d66ab
pastel-cyan-900: #1e558d
```

#### Success - Pastel Mint
```css
pastel-mint-50:  #f0fffd
pastel-mint-100: #ccfff8
pastel-mint-200: #99fff1
pastel-mint-300: #5ffae8  /* Main light */
pastel-mint-400: #2de9d8
pastel-mint-500: #13ccbe  /* Primary */
pastel-mint-600: #0ba89b
pastel-mint-700: #0d847c
pastel-mint-800: #106864
pastel-mint-900: #135653
```

#### Warning - Pastel Pink
```css
pastel-pink-50:  #fff5f9
pastel-pink-100: #ffebf5
pastel-pink-200: #ffd6ed
pastel-pink-300: #ffb3dd  /* Main light */
pastel-pink-400: #ff85c7
pastel-pink-500: #ff5ab0  /* Primary */
pastel-pink-600: #f0388e
pastel-pink-700: #d12171
pastel-pink-800: #ad1d5e
pastel-pink-900: #911e51
```

### Usage Guidelines

- **Backgrounds**: Use 50-100 shades for subtle backgrounds
- **Interactive Elements**: Use 300-500 for buttons, links
- **Text**: Use 700-900 for readable text
- **Borders**: Use 200-300 for soft borders

## Glassmorphism

### Glass Styles

#### Default Glass
```jsx
<div className="glass rounded-xl shadow-glass">
  {/* content */}
</div>
```
- Background: `rgba(255, 255, 255, 0.25)`
- Blur: `10px`
- Border: Subtle white border

#### Light Glass
```jsx
<div className="glass-light rounded-xl shadow-glass">
  {/* content */}
</div>
```
- Background: `rgba(255, 255, 255, 0.35)`
- Blur: `12px`
- More visible, less transparent

#### Heavy Glass
```jsx
<div className="glass-heavy rounded-xl shadow-glass">
  {/* content */}
</div>
```
- Background: `rgba(255, 255, 255, 0.45)`
- Blur: `16px`
- Most opaque, strongest blur

#### Dark Glass
```jsx
<div className="glass-dark rounded-xl shadow-glass">
  {/* content */}
</div>
```
- Background: `rgba(0, 0, 0, 0.15)`
- For light backgrounds

### Glass Hover Effect
```jsx
<div className="glass glass-hover rounded-xl shadow-glass cursor-pointer">
  {/* Interactive content */}
</div>
```
- Smooth transition on hover
- Subtle lift effect (`translateY(-2px)`)

## Gradients

### Pastel Gradient
```jsx
<div className="bg-gradient-pastel">
  {/* Soft blue to purple to cyan gradient */}
</div>
```

### Glass Gradient
```jsx
<div className="bg-gradient-glass">
  {/* Subtle glass-like gradient overlay */}
</div>
```

## Shadows

### Glass Shadows
```css
shadow-glass-sm  /* Subtle: 0 4px 16px rgba(31, 38, 135, 0.1) */
shadow-glass     /* Default: 0 8px 32px rgba(31, 38, 135, 0.15) */
shadow-glass-lg  /* Strong: 0 12px 48px rgba(31, 38, 135, 0.2) */
```

## Typography

### Font Family
```css
font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
```

### Font Sizes (Tailwind Defaults)
- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)

### Font Weights
- `font-light`: 300
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700

## Components

### Card (Glass)
```jsx
<div className="glass rounded-2xl p-6 shadow-glass">
  <h3 className="text-xl font-semibold text-pastel-blue-900 mb-4">
    Card Title
  </h3>
  <p className="text-pastel-blue-700">
    Card content goes here
  </p>
</div>
```

### Button (Primary)
```jsx
<button className="
  px-6 py-3
  bg-pastel-blue-500 hover:bg-pastel-blue-600
  text-white font-medium
  rounded-xl
  shadow-glass-sm
  transition-all duration-300
  hover:shadow-glass
  hover:-translate-y-0.5
">
  Primary Button
</button>
```

### Button (Glass)
```jsx
<button className="
  px-6 py-3
  glass glass-hover
  text-pastel-blue-700 font-medium
  rounded-xl
  shadow-glass-sm
">
  Glass Button
</button>
```

### Input (Glass)
```jsx
<input
  type="text"
  className="
    w-full px-4 py-3
    glass
    rounded-xl
    border-none
    focus:outline-none
    focus:ring-2 focus:ring-pastel-blue-400
    placeholder-pastel-blue-400
    text-pastel-blue-900
  "
  placeholder="Enter text..."
/>
```

### Badge
```jsx
<span className="
  inline-flex items-center
  px-3 py-1
  bg-pastel-cyan-100
  text-pastel-cyan-700
  text-sm font-medium
  rounded-full
">
  Badge
</span>
```

## Layout

### Page Background
```jsx
<div className="min-h-screen bg-gradient-pastel">
  {/* page content */}
</div>
```

### Container
```jsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* content */}
</div>
```

### Grid Layout
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* grid items */}
</div>
```

## Spacing

Use Tailwind's default spacing scale:
- `p-4`: 1rem (16px)
- `p-6`: 1.5rem (24px)
- `p-8`: 2rem (32px)
- `gap-4`: 1rem (16px)
- `gap-6`: 1.5rem (24px)

## Borders

### Border Radius
- `rounded-lg`: 0.5rem (8px)
- `rounded-xl`: 0.75rem (12px)
- `rounded-2xl`: 1rem (16px)
- `rounded-full`: 9999px (full circle)

### Border Width
- `border`: 1px (default glass border)
- `border-2`: 2px (emphasis)

## Animations

### Transitions
```css
transition-all duration-300  /* Smooth all properties */
transition-colors duration-200  /* Color changes only */
transition-transform duration-300  /* Transform only */
```

### Hover Effects
```jsx
hover:scale-105  /* Slight scale up */
hover:-translate-y-1  /* Lift effect */
hover:shadow-glass-lg  /* Enhanced shadow */
```

## Accessibility

### Focus States
Always include visible focus states:
```jsx
focus:outline-none
focus:ring-2
focus:ring-pastel-blue-400
focus:ring-offset-2
```

### Color Contrast
- Ensure text has sufficient contrast (WCAG AA: 4.5:1 for normal text)
- Use darker shades (700-900) for text on light backgrounds
- Use lighter shades (100-300) for text on dark backgrounds

### Semantic HTML
- Use proper heading hierarchy (h1, h2, h3)
- Use `button` for clickable actions
- Use `nav` for navigation
- Add `aria-label` for icon-only buttons

## Responsive Design

### Breakpoints (Tailwind Defaults)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Approach
```jsx
<div className="
  text-base     /* Mobile */
  md:text-lg    /* Tablet */
  lg:text-xl    /* Desktop */
">
  Responsive text
</div>
```

## Best Practices

1. **Consistency**: Use the same glass style throughout similar components
2. **Performance**: Avoid too many blur effects on the same page
3. **Readability**: Ensure text is always readable against glass backgrounds
4. **Hierarchy**: Use different glass intensities to create visual hierarchy
5. **Spacing**: Maintain consistent spacing using Tailwind's scale

## Examples

### Dashboard Card
```jsx
<div className="glass rounded-2xl p-6 shadow-glass">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xl font-semibold text-pastel-blue-900">
      Total Tasks
    </h3>
    <span className="glass-light px-3 py-1 rounded-full text-sm font-medium text-pastel-blue-700">
      24
    </span>
  </div>
  <p className="text-3xl font-bold text-pastel-blue-600">
    156
  </p>
  <p className="text-sm text-pastel-blue-500 mt-2">
    +12% from last month
  </p>
</div>
```

### Navigation Bar
```jsx
<nav className="glass-light shadow-glass">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-pastel-blue-700">
          Kanban
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="glass glass-hover px-4 py-2 rounded-xl text-pastel-blue-700 font-medium">
          Profile
        </button>
      </div>
    </div>
  </div>
</nav>
```

### Kanban Column
```jsx
<div className="glass rounded-2xl p-4 shadow-glass min-h-[500px]">
  <h3 className="text-lg font-semibold text-pastel-purple-900 mb-4">
    To Do
  </h3>
  <div className="space-y-3">
    {/* Cards */}
  </div>
</div>
```

### Task Card
```jsx
<div className="glass-light glass-hover rounded-xl p-4 cursor-pointer shadow-glass-sm">
  <h4 className="font-medium text-pastel-blue-900 mb-2">
    Task Title
  </h4>
  <p className="text-sm text-pastel-blue-600 mb-3">
    Task description goes here
  </p>
  <div className="flex items-center gap-2">
    <span className="px-2 py-1 bg-pastel-cyan-100 text-pastel-cyan-700 text-xs rounded-full">
      Priority: High
    </span>
  </div>
</div>
```

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Glassmorphism Generator](https://hype4.academy/tools/glassmorphism-generator)
- [Color Accessibility](https://webaim.org/resources/contrastchecker/)
