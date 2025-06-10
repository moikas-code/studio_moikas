'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="alert alert-error">
        <h2 className="font-bold">Something went wrong!</h2>
        <p>{error.message || 'An error occurred while loading the models page.'}</p>
        <button onClick={reset} className="btn btn-sm">
          Try again
        </button>
      </div>
    </div>
  )
}