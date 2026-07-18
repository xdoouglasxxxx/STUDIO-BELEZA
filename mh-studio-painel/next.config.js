const withPWA = require("next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development"
})

module.exports = withPWA({
  reactStrictMode: true,
  images: { domains: [process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "") || "seu-projeto.supabase.co"] }
})
