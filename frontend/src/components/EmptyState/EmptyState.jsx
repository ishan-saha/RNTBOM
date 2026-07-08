import Loading from '../Loading/Loading';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-slate-400">{icon}</div>}
      <h6 className="text-lg font-semibold text-slate-400 mb-2">
        {title || 'No data available'}
      </h6>
      {description && (
        <p className="text-sm text-slate-400 mb-4" style={{ maxWidth: 400 }}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function LoadingState({ message }) {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <Loading message={message} />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      icon={<span style={{ fontSize: 48 }}>⚠️</span>}
      title="Something went wrong"
      description={message || 'An unexpected error occurred'}
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="bg-indigo-500 text-white border-0 rounded-lg px-6 py-2 cursor-pointer font-semibold"
          >
            Retry
          </button>
        )
      }
    />
  );
}