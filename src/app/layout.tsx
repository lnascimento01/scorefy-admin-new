import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import EchoInitializer from '@/components/EchoInitializer'
import { I18nProvider } from '@/lib/i18n'
import { ThemeInitializer } from '@/theme/ThemeInitializer'

export const metadata = {
  title: 'Scorefy Admin',
  description: 'Painel administrativo Scorefy',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light" className="light">
      <body suppressHydrationWarning={true}>
        <EchoInitializer />
        <ThemeInitializer />
        <AuthProvider>
          <I18nProvider>{children}</I18nProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
