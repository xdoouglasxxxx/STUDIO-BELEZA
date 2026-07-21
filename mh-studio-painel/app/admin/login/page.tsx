"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("Credenciais inválidas.")
      setLoading(false)
      return
    }
    router.push("/admin")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8F0] p-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-[#C9A86C]/20">
        <div className="bg-[#0A1F44] p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-[#C9A86C] rounded-full flex items-center justify-center shadow-lg mb-4">
            <span className="font-serif text-3xl font-bold text-[#0A1F44]">MH</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">Studio Myleine Hofmann</h1>
          <p className="text-[#C9A86C] text-sm tracking-widest mt-1 uppercase">Painel Administrativo</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0A1F44]/80">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="myleine@email.com" required className="w-full px-4 py-3 rounded-xl border border-[#0A1F44]/10 bg-[#FDF8F0] focus:outline-none focus:ring-2 focus:ring-[#C9A86C]/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0A1F44]/80">Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-4 py-3 rounded-xl border border-[#0A1F44]/10 bg-[#FDF8F0] focus:outline-none focus:ring-2 focus:ring-[#C9A86C]/50" />
            </div>
            {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">{error}</div>}
            <Button type="submit" variant="gold" size="lg" className="w-full h-12 font-bold tracking-wider" disabled={loading}>
              {loading ? "Entrando..." : "ENTRAR NO PAINEL"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
