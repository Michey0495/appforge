import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // pdf.js の worker ファイルを static に配置するための設定
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
