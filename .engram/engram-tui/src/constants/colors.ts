/**
 * Color hex codes and styling
 */

export const COLORS = {
  // Type colors (ANSI/hex)
  types: {
    architecture: '#0066CC',
    decision: '#9933FF',
    bugfix: '#FF3333',
    discovery: '#00AA44',
    pattern: '#FF8800',
    config: '#FFBB00',
    learning: '#00CCFF',
    manual: '#AAAAAA',
  },

  // UI colors
  ui: {
    primary: '#0066CC',
    success: '#00AA44',
    warning: '#FF8800',
    error: '#FF3333',
    info: '#00CCFF',
    disabled: '#666666',
    text_primary: '#FFFFFF',
    text_secondary: '#CCCCCC',
    bg_dark: '#000000',
    bg_light: '#FFFFFF',
  },

  // Border colors
  borders: {
    primary: '#0066CC',
    secondary: '#666666',
    disabled: '#333333',
  },
};

export const EMOJI = {
  types: {
    architecture: '🏛️ ',
    decision: '🟣',
    bugfix: '🔴',
    discovery: '🟢',
    pattern: '🟠',
    config: '🟡',
    learning: '🟦',
    manual: '⚪',
  },

  actions: {
    check: '✅',
    error: '❌',
    warning: '⚠️ ',
    info: 'ℹ️ ',
    loading: '⏳',
    success: '🎉',
    folder: '📁',
    file: '📄',
    search: '🔍',
    stats: '📊',
    export: '📤',
    settings: '⚙️ ',
    back: '⬅️ ',
    home: '🏠',
    menu: '☰',
    favorite: '⭐',
    unfavorite: '☆',
  },
};

export const STYLES = {
  // Border styles
  borders: {
    single: {
      top: '─',
      bottom: '─',
      left: '│',
      right: '│',
      top_left: '┌',
      top_right: '┐',
      bottom_left: '└',
      bottom_right: '┘',
    },
    double: {
      top: '═',
      bottom: '═',
      left: '║',
      right: '║',
      top_left: '╔',
      top_right: '╗',
      bottom_left: '╚',
      bottom_right: '╝',
    },
  },

  // Separators
  separators: {
    horizontal: '─',
    vertical: '│',
    cross: '┼',
  },
};
