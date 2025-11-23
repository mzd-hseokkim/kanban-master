export const LABEL_COLOR_TOKENS = [
  { value: 'pastel-blue-500', label: 'Blue', color: '#8fb3ff' },
  { value: 'pastel-pink-500', label: 'Pink', color: '#ffb3e6' },
  { value: 'pastel-green-500', label: 'Green', color: '#b3ffc4' },
  { value: 'pastel-purple-500', label: 'Purple', color: '#d4a5ff' },
  { value: 'pastel-yellow-500', label: 'Yellow', color: '#fff4b3' },
  { value: 'pastel-orange-500', label: 'Orange', color: '#ffd4b3' },
  { value: 'pastel-red-500', label: 'Red', color: '#ffb3b3' },
  { value: 'pastel-teal-500', label: 'Teal', color: '#b3ffe6' },
];

export const getLabelColor = (token: string): string => {
  const found = LABEL_COLOR_TOKENS.find((t) => t.value === token);
  return found ? found.color : '#e5e7eb'; // Default to gray-200 if not found
};
