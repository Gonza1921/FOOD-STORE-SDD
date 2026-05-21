/**
 * UI messages and strings
 */

export const MESSAGES = {
  // Navigation
  navigation: {
    main_menu: 'ENGRAM MEMORY BROWSER v1.0',
    browse_projects: '📁 Browse Projects',
    search_observations: '🔍 Search Observations',
    view_recent: '📋 View Recent',
    filter_by_type: '🏷️  Filter by Type',
    statistics: '📊 Statistics & Analytics',
    export_data: '📤 Export Data',
    settings: '⚙️  Settings',
    quit: '🚪 Quit',
  },

  // Actions
  actions: {
    select: 'Select',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    cancel: 'Cancel',
    confirm: 'Confirm',
    search: 'Search',
    export: 'Export',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    refresh: 'Refresh',
    clear: 'Clear',
    apply: 'Apply',
  },

  // Status messages
  status: {
    loading: 'Loading...',
    searching: 'Searching...',
    exporting: 'Exporting...',
    no_results: 'No results found',
    no_data: 'No data available',
    error_occurred: 'An error occurred',
    success: 'Success',
  },

  // Keyboard hints
  hints: {
    navigate: '↑↓ Navigate',
    select: 'Enter Select',
    back: 'q Back',
    search: '/ Search',
    help: '? Help',
    quit: 'Ctrl+C Quit',
  },

  // Error messages
  errors: {
    connection_failed: 'Connection to Engram failed',
    invalid_config: 'Invalid configuration',
    file_not_found: 'File not found',
    permission_denied: 'Permission denied',
    invalid_input: 'Invalid input',
    export_failed: 'Export failed',
    api_error: 'API error',
  },

  // Success messages
  success_messages: {
    exported: 'Exported successfully',
    deleted: 'Deleted successfully',
    updated: 'Updated successfully',
    copied: 'Copied to clipboard',
  },
};

export const LABELS = {
  // Type labels
  observation_types: {
    architecture: 'Architecture',
    decision: 'Decision',
    bugfix: 'Bugfix',
    discovery: 'Discovery',
    pattern: 'Pattern',
    config: 'Config',
    learning: 'Learning',
    manual: 'Manual',
  },

  // Scope labels
  scopes: {
    project: 'Project',
    personal: 'Personal',
  },

  // Export formats
  export_formats: {
    json: 'JSON (.json)',
    csv: 'CSV (.csv)',
    markdown: 'Markdown (.md)',
    xml: 'XML (.xml)',
  },

  // Time ranges
  time_ranges: {
    all: 'All Time',
    '1_day': 'Last 24 Hours',
    '1_week': 'Last 7 Days',
    '1_month': 'Last 30 Days',
    '3_months': 'Last 90 Days',
  },
};
