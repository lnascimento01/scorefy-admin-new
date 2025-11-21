'use client'

interface SubmitButtonProps {
  label: string
  loading?: boolean
}

export function SubmitButton({ label, loading }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-onPrimary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Entrando...' : label}
    </button>
  )
}
