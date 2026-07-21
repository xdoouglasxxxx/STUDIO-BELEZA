"use client"

import { createClient } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, Calendar, Clock, Images, Users, Sparkles, LogOut, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

const menuItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Agenda", href: "/admin/agenda", icon: Calendar },
  { label: "Horários", href: "/admin/horarios", icon: Clock },
  { label: "Perfil", href: "/admin/perfil", icon: User },
  { label: "Galeria", href: "/admin/galeria", icon: Images },
  { label: "Clientes", href: "/admin/clientes", icon: Users },
  { label: "Serviços", href: "/admin/servicos", icon: Sparkles },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user)
    })
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  if (pathname === "/admin/login") return <>{children}</>

  return (
    <div className="flex h-screen bg-[#FDF8F0] text-[#0A1F44]">
      <aside className="hidden lg:flex flex-col w-64 bg-[#0A1F44] text-white h-full shrink-0 p-6 rounded-r-[2rem] shadow-2xl z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-full bg-[#C9A86C] flex items-center justify-center text-[#0A1F44] font-serif font-bold text-lg">MH</div>
          <div><h2 className="font-serif text-lg font-bold leading-tight">Studio MH</h2><p className="text-[10px] tracking-widest text-[#C9A86C] uppercase">Admin</p></div>
        </div>
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-medium", isActive ? "bg-white text-[#0A1F44] shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10")}>
                <item.icon className="w-5 h-5" /> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="pt-6 border-t border-white/10 mt-auto">
          <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 rounded-full" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Sair</Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="lg:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-[#0A1F44]/5 shrink-0">
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-[#C9A86C] flex items-center justify-center text-[#0A1F44] font-serif font-bold text-sm">MH</div><h1 className="font-serif text-lg font-semibold">Painel</h1></div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</Button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">{children}</div>
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#0A1F44]/10 px-2 py-2 pb-safe z-30">
          <div className="flex justify-around items-center">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all", isActive ? "text-[#0A1F44]" : "text-[#0A1F44]/40")}>
                  <div className={cn("p-1.5 rounded-full transition-all", isActive && "bg-[#C9A86C]/10")}><item.icon className={cn("w-5 h-5", isActive ? "text-[#0A1F44]" : "text-[#0A1F44]/60")} /></div>
                  <span className={cn("text-[10px] font-medium", isActive ? "text-[#0A1F44]" : "text-[#0A1F44]/60")}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-20 bg-[#0A1F44]/80 backdrop-blur-sm">
            <div className="bg-white h-full w-[80%] max-w-sm p-6 animate-in slide-in-from-left">
              <div className="flex justify-between items-center mb-8"><h2 className="font-serif text-xl font-bold">Menu</h2><Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6" /></Button></div>
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FDF8F0] transition-colors">
                    <item.icon className="w-5 h-5 text-[#C9A86C]" /> <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors mt-4"><LogOut className="w-5 h-5" /> <span className="font-medium">Sair</span></button>
              </nav>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
