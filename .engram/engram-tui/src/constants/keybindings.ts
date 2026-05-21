/**
 * Keyboard bindings configuration
 */

export const DEFAULT_KEYBINDINGS = {
  // Navigation
  up: ['up', 'k'],
  down: ['down', 'j'],
  left: ['left', 'h'],
  right: ['right', 'l'],

  // Selection
  select: ['return', 'enter'],
  back: ['q', 'escape'],
  quit: ['ctrl+c', 'ctrl+q'],

  // Search
  search: ['/'],
  clear_search: ['ctrl+u'],

  // Actions
  view: ['v'],
  edit: ['e'],
  delete: ['d'],
  copy: ['c'],
  export: ['x'],
  refresh: ['r'],

  // Menu
  help: ['?'],
  home: ['g', 'home'],

  // Selection in lists
  select_all: ['*'],
  deselect_all: ['0'],
};

export const VIM_KEYBINDINGS = {
  // Navigation (hjkl)
  up: ['k', 'up'],
  down: ['j', 'down'],
  left: ['h', 'left'],
  right: ['l', 'right'],

  // Selection
  select: ['return', 'enter'],
  back: ['q', 'escape'],
  quit: ['ctrl+c', ':q'],

  // Search
  search: ['/'],
  clear_search: ['ctrl+u', 'ctrl+h'],

  // Actions
  view: ['v', 'o'],
  edit: ['e', 'i'],
  delete: ['d'],
  copy: ['y'],
  export: ['x'],
  refresh: ['r', 'u'],

  // Vim-style
  goto_start: ['g', 'g'],
  goto_end: ['G'],
  next_item: ['n'],
  previous_item: ['N'],
};

export const EMACS_KEYBINDINGS = {
  // Navigation (Ctrl+N/P)
  up: ['ctrl+p', 'up'],
  down: ['ctrl+n', 'down'],
  left: ['ctrl+b', 'left'],
  right: ['ctrl+f', 'right'],

  // Selection
  select: ['return', 'enter'],
  back: ['ctrl+g', 'escape'],
  quit: ['ctrl+c'],

  // Search
  search: ['ctrl+s'],
  clear_search: ['ctrl+u', 'ctrl+h'],

  // Actions
  view: ['ctrl+v'],
  edit: ['ctrl+e'],
  delete: ['ctrl+d'],
  copy: ['meta+w'],
  export: ['ctrl+x'],
  refresh: ['ctrl+r'],

  // Emacs-style
  goto_start: ['meta+<'],
  goto_end: ['meta+>'],
};

export const KEYBINDING_MODES = {
  default: DEFAULT_KEYBINDINGS,
  vim: VIM_KEYBINDINGS,
  emacs: EMACS_KEYBINDINGS,
} as const;

export type KeybindingMode = keyof typeof KEYBINDING_MODES;
