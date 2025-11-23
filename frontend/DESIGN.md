# Kanban Board - Design System

## Overview

A **Vibrant Dark Glassmorphism** design system that combines a deep, rich mesh gradient background with light, semi-transparent glass panels. This creates a modern, premium aesthetic where content floats above a dynamic backdrop.

## Design Philosophy

### Core Principles

1.  **Vibrant Dark Mode**: A dark, immersive background (`#0f172a` base) enriched with a dynamic mesh gradient of deep blues, purples, and reds.
2.  **Light Glass Panels**: Content containers use a light, semi-transparent white background (`rgba(255, 255, 255, 0.1)` to `0.9`) to create contrast against the dark background.
3.  **Pastel Accents**: Text and interactive elements use vibrant pastel colors to ensure readability and visual interest against the glass panels.
4.  **Depth & Layering**: Heavy use of shadows and backdrop blurs to establish hierarchy.

## Color Palette

### Backgrounds
The application uses a global mesh gradient defined in `index.css`:
```css
--page-transition-background:
  radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%),
  radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%),
  radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%);
```

### Pastel Cool Colors (Tailwind Config)
Used for text, borders, and accents.

#### Blue (Primary)
-   `text-pastel-blue-900`: Main headings
-   `text-pastel-blue-700`: Body text
-   `bg-pastel-blue-500`: Primary buttons

#### Purple (Secondary)
-   `text-pastel-purple-900`: Secondary headings
-   `bg-pastel-purple-100`: Badges/Tags

#### Pink/Red (Accents/Warnings)
-   `text-pastel-pink-600`: Alerts, high priority
-   `bg-pastel-pink-50`: Error backgrounds

*(Refer to `tailwind.config.js` for the full color scale)*

## Glassmorphism Utilities

Defined in `index.css` and `tailwind.config.js`.

### Glass Classes

| Class | Description | Usage |
| :--- | :--- | :--- |
| `.glass` | Standard glass effect. White tint (10%), blur (12px). | General containers, cards. |
| `.glass-light` | Lighter, more opaque. White tint (15%), blur (16px). | Active states, headers. |
| `.glass-heavy` | Darker glass. Dark blue tint, blur (20px). | Sidebars, heavy overlays. |
| `.glass-modal` | High opacity. White tint (90%), blur (24px). | Modals, dialogs. |
| `.glass-hover` | Hover effect. Increases opacity and lift. | Interactive cards, buttons. |

### Shadows
-   `shadow-glass`: `0 8px 32px 0 rgba(31, 38, 135, 0.15)`
-   `shadow-glass-sm`: `0 4px 16px 0 rgba(31, 38, 135, 0.1)`

## Typography

**Font Family**: Pretendard Variable, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif.

### Text Colors on Glass
Since glass panels are light-tinted, use **dark** text colors for contrast.
-   **Headings**: `text-pastel-blue-900` or `text-slate-900`
-   **Body**: `text-pastel-blue-800` or `text-slate-700`
-   **Muted**: `text-pastel-blue-600` or `text-slate-500`

## Components

### 1. Page Container
The root element has the dark mesh background.
```jsx
<div className="min-h-screen text-slate-900">
  {/* The background is applied to body/html in index.css */}
  {/* Content goes here */}
</div>
```

### 2. Kanban Column
A glass container holding cards.
```jsx
<div className="glass rounded-2xl p-4 flex flex-col h-full max-h-full">
  <div className="flex items-center justify-between mb-4 p-1">
    <h3 className="font-bold text-pastel-blue-900">To Do</h3>
    <span className="bg-white/20 px-2 py-1 rounded text-sm">3</span>
  </div>
  <div className="flex-1 overflow-y-auto space-y-3">
    {/* Cards */}
  </div>
</div>
```

### 3. Kanban Card
A lighter glass element inside the column.
```jsx
<div className="bg-white/40 hover:bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/20 transition-all cursor-pointer group">
  <div className="flex justify-between items-start mb-2">
    <span className="bg-pastel-purple-100 text-pastel-purple-700 text-xs px-2 py-1 rounded-full font-medium">
      Feature
    </span>
  </div>
  <h4 className="text-pastel-blue-900 font-semibold mb-1 group-hover:text-pastel-blue-700">
    Implement Login
  </h4>
  <div className="flex items-center gap-2 mt-3 text-pastel-blue-600 text-sm">
    <Avatar size="sm" />
    <span>Due Tomorrow</span>
  </div>
</div>
```

### 4. Primary Button
Vibrant background with shadow.
```jsx
<button className="bg-pastel-blue-500 hover:bg-pastel-blue-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-pastel-blue-500/30 transition-all active:scale-95">
  Create Task
</button>
```

### 5. Secondary/Ghost Button
Glass style button.
```jsx
<button className="glass hover:bg-white/20 text-pastel-blue-800 px-4 py-2 rounded-xl transition-all">
  Cancel
</button>
```

### 6. Modal
High opacity glass to focus attention.
```jsx
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
  <div className="glass-modal w-full max-w-2xl rounded-2xl p-6 shadow-2xl animate-fadeIn">
    <h2 className="text-2xl font-bold text-pastel-blue-900 mb-4">Edit Task</h2>
    {/* Form Content */}
  </div>
</div>
```

## Motion & Animation

-   **Page Transitions**: Slide and fade effects defined in `index.css` (`pageSlideIn`, `pageSlideOut`).
-   **Hover Effects**: `transition-all duration-200` is standard. Cards lift (`-translate-y-1`) on hover.
-   **Modals**: Scale and fade in (`dialogFadeIn`).

## Best Practices

1.  **Contrast is Key**: Ensure text is dark enough (`700`-`900` weights) to be readable on the semi-transparent white glass backgrounds.
2.  **Avoid Double Glass**: Try not to nest too many glass layers (e.g., glass card inside glass column inside glass modal) as it can get muddy. Use solid colors or higher opacity for nested elements.
3.  **Vibrant Accents**: Use the pastel color palette to add life to the UI, preventing it from looking too "frosted" and washed out.
