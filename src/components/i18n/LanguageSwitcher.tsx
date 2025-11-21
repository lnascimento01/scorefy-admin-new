'use client'

import { useI18n } from '@/lib/i18n'

interface LanguageSwitcherProps {
  size?: 'sm' | 'md'
}

export function LanguageSwitcher({ size = 'md' }: LanguageSwitcherProps) {
  const { language, setLanguage, availableLanguages, dictionary } = useI18n()

  return (
    <label className="flex items-center gap-2 text-xs font-medium text-textSecondary">
      <span>{dictionary.language.switcherLabel}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as typeof language)}
        className={`rounded-full border border-borderSoft bg-[var(--surface-elevated-strong)] px-3 ${size === 'sm' ? 'py-1 text-xs' : 'py-1.5 text-sm'} text-textPrimary transition focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30`}
      >
        {availableLanguages.map((option) => (
          <option key={option.code} value={option.code} className="bg-surface text-textPrimary">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
