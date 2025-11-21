const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api'
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ??
  process.env.INTERNAL_API_BASE ??
  process.env.NEXT_PUBLIC_API_BASE

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const isRelativeProxy =
      API_PROXY_TARGET && PUBLIC_API_BASE.startsWith('/') && API_PROXY_TARGET.startsWith('http')

    if (!isRelativeProxy) return []

    const source = `${PUBLIC_API_BASE.replace(/\/$/, '')}/:path*`
    const destination = `${API_PROXY_TARGET.replace(/\/$/, '')}/:path*`

    return [
      {
        source,
        destination,
      },
    ]
  },
}

export default nextConfig
