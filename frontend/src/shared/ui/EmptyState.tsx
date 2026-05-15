interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <span
          className="material-symbols-outlined text-on-surface-variant mb-4"
          style={{ fontSize: '48px', opacity: 0.5 }}
        >
          {icon}
        </span>
      )}
      <h3 className="text-lg font-medium text-on-surface mb-2">{title}</h3>
      {description && (
        <p className="text-on-surface-variant max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}