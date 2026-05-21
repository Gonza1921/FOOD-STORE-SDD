/**
 * UI component types
 */

export interface MenuOption {
  label: string;
  key: string | number;
  hint?: string;
  disabled?: boolean;
}

export interface NavigationState {
  current_screen: string;
  breadcrumbs: string[];
  previous_screen?: string;
}

export interface LoadingState {
  is_loading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  has_error: boolean;
  message?: string;
  code?: string;
  retry_fn?: () => Promise<void>;
}

export interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}
