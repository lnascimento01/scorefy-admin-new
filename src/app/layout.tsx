import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { I18nProvider } from '@/lib/i18n'

export const metadata = {
  title: 'Scorefy Admin',
  description: 'Painel administrativo Scorefy',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <I18nProvider>{children}</I18nProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
