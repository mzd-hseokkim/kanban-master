# Dark Mode Support Plan

## 1. Foundation Setup
- [ ] **Tailwind Configuration**
    - Update `tailwind.config.js` to enable `darkMode: 'class'`.
    - Extend `colors` with semantic names mapping to CSS variables:
        - `background`, `surface`, `surface-highlight`
        - `border`
        - `text-heading`, `text-body`, `text-muted`
- [ ] **Global Styles (`index.css`)**
    - Define CSS variables in `:root` for Light Mode.
    - Define CSS variables in `.dark` selector for Dark Mode.
    - Refactor `.glass` utilities to adapt to both themes (using opacity variables or semantic colors).

## 2. Component Migration
- [ ] **Layout & Core Views**
    - **ListView**: Replace `bg-white`, `bg-slate-50` with `bg-surface`, `bg-background`.
    - **Board Layout**: Ensure the main board background adapts correctly.
- [ ] **Cards & Lists**
    - **ListCardRow**: Update card background, border, and text colors.
    - **Column Headers**: Update background and text for column titles.
- [ ] **Modals & Overlays**
    - **EditCardModal**: Update modal background (`bg-white` -> `bg-surface`) and input fields.
    - **CreateCardModal**: Apply same semantic styles.
    - **Dialogs**: Ensure confirmation dialogs are dark-mode compatible.
- [ ] **UI Elements**
    - **Inputs**: Update `input`, `textarea`, `select` styles in `index.css` or global base styles.
    - **Dropdowns**: Update `.dropdown-panel` and menu items.

## 3. Feature Implementation
- [ ] **Theme Infrastructure**
    - Create `src/context/ThemeContext.tsx`.
    - Implement logic to read/write theme preference to `localStorage`.
    - Handle system preference detection (`prefers-color-scheme`).
- [ ] **UI Controls**
    - Create `src/components/ThemeToggle.tsx`.
    - Integrate the toggle into the Global Navigation Bar (GNB).

## 4. Verification & Polish
- [ ] **Manual Testing**
    - Verify "Flash of Incorrect Theme" (FOUC) is minimized on load.
    - Check all hover states and transitions.
    - Verify text contrast in Dark Mode.
