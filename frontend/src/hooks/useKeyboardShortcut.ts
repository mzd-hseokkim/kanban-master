import { useHotkeys, type Options } from 'react-hotkeys-hook';

/**
 * Custom hook to register keyboard shortcuts with automatic input field detection.
 * Shortcuts are automatically disabled when user is typing in input fields.
 *
 * @param keys - The key combination (e.g., 'c', 'cmd+enter', 'esc')
 * @param callback - Function to execute when the shortcut is triggered
 * @param options - Additional options including scope and dependencies
 */
export const useKeyboardShortcut = (
  keys: string,
  callback: () => void,
  options: Options = {}
) => {
  const defaultOptions: Options = {
    // Prevent shortcuts from firing in input fields by default
    enableOnFormTags: false,
    // Don't prevent default browser behavior unless specified
    preventDefault: options.preventDefault ?? false,
    ...options,
  };

  return useHotkeys(keys, callback, defaultOptions);
};

/**
 * Check if the current active element is an input field
 */
export const isInputFocused = (): boolean => {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isContentEditable
  );
};
