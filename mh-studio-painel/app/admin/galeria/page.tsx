"use client"

import { createClient } from "@/lib/supabase"
import { useCallback, useEffect, useState } from "react"
import { Upload, Trash2, Loader2, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export default function GaleriaPage() {
  const supabase = createClient()
  const [fotos, setFotos] = useState<any[]>([])
  const [studioId, setStudioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data: studio } = await supabase.from("studios").select("id").limit(1).maybeSingle()
    if (studio) setStudioId(studio.id)
    const { data } = await supabase
      .from("gallery")
      .select("id, image_url, service_type")
      .order("created_at", { ascending: false })
    setFotos(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setErro("")
    setEnviando(true)
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue
      if (file.size > 8 * 1024 * 1024) { setErro("Cada foto deve ter no máximo 8MB."); continue }
      const ext = file.name.split(".").pop() || "jpg"
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error: upErr } = await supabase.storage.from("gallery").upload(path, file, { cacheControl: "3600" })
      if (upErr) {
        setErro('Falha no upload. Confira se o bucket "gallery" foi criado (arquivo 3-galeria-storage.sql).')
        continue
      }
      const { data: pub } = supabase.storage.from("gallery").getPublicUrl(path)
      if (pub?.publicUrl) {
        await supabase.from("gallery").insert({ studio_id: studioId, image_url: pub.publicUrl })
      }
    }
    setEnviando(false)
    fetchAll()
  }

  const remover = async (foto: any) => {
    // remove o registro; o arquivo no storage pode ser limpo depois
    const { error } = await supabase.from("gallery").delete().eq("id", foto.id)
    if (!error) setFotos((prev) => prev.filter((f) => f.id !== foto.id))
    // tenta remover o arquivo do storage também (se a URL for do bucket)
    const marker = "/object/public/gallery/"
    const idx = String(foto.image_url).indexOf(marker)
    if (idx !== -1) {
      const path = String(foto.image_url).slice(idx + marker.length)
      await supabase.storage.from("gallery").remove([path])
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#C9A86C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold">Galeria</h1>
        <p className="text-sm text-[#0A1F44]/60 mt-1">{fotos.length} foto{fotos.length === 1 ? "" : "s"} do seu trabalho.</p>
      </div>

      <label
        className={cn(
          "block bg-white rounded-2xl border-2 border-dashed border-[#C9A86C]/40 p-8 text-center cursor-pointer hover:bg-[#FDF8F0] transition-colors",
          enviando && "opacity-60 pointer-events-none",
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files) }}
      >
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
        <div className="w-12 h-12 rounded-full bg-[#C9A86C]/15 flex items-center justify-center mx-auto mb-3">
          {enviando ? <Loader2 className="w-5 h-5 text-[#C9A86C] animate-spin" /> : <Upload className="w-5 h-5 text-[#C9A86C]" />}
        </div>
        <p className="font-medium text-sm">{enviando ? "Enviando fotos..." : "Toque para escolher fotos ou arraste aqui"}</p>
        <p className="text-xs text-[#0A1F44]/50 mt-1">JPG, PNG ou WebP • até 8MB cada</p>
      </label>

      {erro && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erro}</div>
      )}

      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {fotos.map((f) => (
            <div key={f.id} className="relative group rounded-2xl overflow-hidden border border-[#0A1F44]/5 bg-white aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.image_url} alt={f.service_type || "Foto da galeria"} className="w-full h-full object-cover" loading="lazy" />
              <button
                onClick={() => remover(f)}
                className="absolute top-2 right-2 p-2 rounded-full bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                aria-label="Remover foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[#0A1F44]/50 text-center flex items-center justify-center gap-1">
        <Star className="w-3 h-3 text-[#C9A86C]" /> Em breve essas fotos aparecem na galeria do site.
      </p>
    </div>
  )
}
