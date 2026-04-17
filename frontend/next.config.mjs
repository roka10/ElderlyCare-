/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_KEY ?? "",
    NEXT_PUBLIC_ELDERLY_PERSON_ID: process.env.NEXT_PUBLIC_ELDERLY_PERSON_ID ?? process.env.ELDERLY_PERSON_ID ?? "",
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
