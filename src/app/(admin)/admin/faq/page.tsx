"use client"
import { useEffect, useState } from "react"
import { useAdminStore } from "@/store/useAdminStore"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"

export default function AdminFAQPage() {
  const { faq, loaded, loadFromSupabase, addFAQ, updateFAQ, deleteFAQ, updateTerms, terms } = useAdminStore()
  const [adding, setAdding] = useState(false); const [newP, setNewP] = useState(""); const [newR, setNewR] = useState("")
  const [editing, setEditing] = useState<string | null>(null); const [editP, setEditP] = useState(""); const [editR, setEditR] = useState("")
  const [editingTerms, setEditingTerms] = useState(false); const [termsDraft, setTermsDraft] = useState(terms)

  useEffect(() => { loadFromSupabase() }, [])
  useEffect(() => { setTermsDraft(terms) }, [terms])

  if (!loaded) return <div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-5 lg:p-7 lg:pt-7 space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="font-display text-2xl text-text-strong">Preguntas frecuentes</h1><p className="text-sm text-text-muted mt-1">{faq.length} preguntas</p></div><button onClick={() => setAdding(true)} className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-hover transition-colors"><Plus className="w-4 h-4" /> Agregar</button></div>
        {adding && <div className="bg-surface-card rounded-xl border border-border-subtle p-5 space-y-3"><input value={newP} onChange={e => setNewP(e.target.value)} placeholder="Pregunta" autoFocus className="w-full h-10 px-3 rounded-lg bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" /><textarea value={newR} onChange={e => setNewR(e.target.value)} rows={3} placeholder="Respuesta" className="w-full px-3 py-2 rounded-lg bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none resize-none" /><div className="flex gap-2 justify-end"><button onClick={() => { setAdding(false); setNewP(""); setNewR("") }} className="px-4 py-2 rounded-full border border-border-default text-sm font-semibold">Cancelar</button><button onClick={() => { addFAQ(newP, newR); setAdding(false); setNewP(""); setNewR("") }} className="px-4 py-2 rounded-full bg-brand text-white text-sm font-semibold">Guardar</button></div></div>}
        <div className="space-y-2">{faq.map(item => (
          <div key={item.id} className="bg-surface-card rounded-xl border border-border-subtle p-4">
            {editing === item.id ? <div className="space-y-3"><input value={editP} onChange={e => setEditP(e.target.value)} autoFocus className="w-full h-10 px-3 rounded-lg bg-surface-sunken text-sm border border-brand outline-none" /><textarea value={editR} onChange={e => setEditR(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg bg-surface-sunken text-sm border border-brand outline-none resize-none" /><div className="flex gap-2 justify-end"><button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-full border border-border-default text-xs font-semibold">Cancelar</button><button onClick={() => { updateFAQ(item.id, editP, editR); setEditing(null) }} className="px-3 py-1.5 rounded-full bg-brand text-white text-xs font-semibold">Guardar</button></div></div> : <div className="flex items-start gap-3"><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-text-strong">{item.pregunta}</p><p className="text-xs text-text-muted mt-1 line-clamp-2">{item.respuesta}</p></div><div className="flex gap-1 shrink-0"><button onClick={() => { setEditing(item.id); setEditP(item.pregunta); setEditR(item.respuesta) }} className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-matcha-100 transition-colors"><Pencil className="w-3.5 h-3.5 text-text-muted" /></button><button onClick={() => deleteFAQ(item.id)} className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-error-50 hover:text-error-500 transition-colors"><Trash2 className="w-3.5 h-3.5 text-text-muted" /></button></div></div>}
          </div>
        ))}</div>
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 space-y-3"><div className="flex items-center justify-between"><h2 className="font-display text-lg text-text-strong">Términos y condiciones</h2><button onClick={() => setEditingTerms(!editingTerms)} className="text-sm text-matcha-600 font-semibold hover:underline">{editingTerms ? "Cancelar" : "Editar"}</button></div>{editingTerms ? <div className="space-y-3"><textarea value={termsDraft} onChange={e => setTermsDraft(e.target.value)} rows={12} className="w-full px-4 py-3 rounded-xl bg-surface-sunken text-sm border border-brand outline-none resize-none text-xs" /><button onClick={() => { updateTerms(termsDraft); setEditingTerms(false) }} className="px-4 py-2 rounded-full bg-brand text-white text-sm font-semibold">Guardar términos</button></div> : <div className="text-xs text-text-muted whitespace-pre-line max-h-40 overflow-y-auto bg-surface-sunken rounded-lg p-3">{terms}</div>}</div>
      </div>
    </div>
  )
}
