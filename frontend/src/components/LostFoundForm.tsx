import { useState, type FormEvent } from 'react'
import { api } from '../api'
import { useUi } from '../ui'

export function LostFoundForm({ onCreated }: { onCreated: () => Promise<void> | void }) {
  const { toast } = useUi()
  const [busy, setBusy] = useState(false)
  const [itemType, setItemType] = useState<'PERDU' | 'TROUVE'>('PERDU')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [itemDate, setItemDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [photo, setPhoto] = useState<File | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const created = await api<{ id: number }>('/objets-perdus-trouves', {
        method: 'POST',
        body: JSON.stringify({
          item_type: itemType,
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          category: category.trim() || null,
          color: color.trim() || null,
          item_date: itemDate,
        }),
      })
      if (photo) {
        const fd = new FormData()
        fd.append('file', photo)
        await api(`/objets-perdus-trouves/${created.id}/photo`, { method: 'POST', body: fd })
      }
      setTitle('')
      setDescription('')
      setLocation('')
      setCategory('')
      setColor('')
      setPhoto(null)
      toast('Déclaration enregistrée.')
      await onCreated()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Déclaration impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label>
        Type
        <select value={itemType} onChange={(e) => setItemType(e.target.value as 'PERDU' | 'TROUVE')}>
          <option value="PERDU">Objet perdu</option>
          <option value="TROUVE">Objet trouvé</option>
        </select>
      </label>
      <label>
        Titre
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
      </label>
      <label>
        Description
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </label>
      <label>
        Lieu
        <input value={location} onChange={(e) => setLocation(e.target.value)} required maxLength={200} />
      </label>
      <label>
        Catégorie (optionnel)
        <input value={category} onChange={(e) => setCategory(e.target.value)} />
      </label>
      <label>
        Couleur (optionnel)
        <input value={color} onChange={(e) => setColor(e.target.value)} />
      </label>
      <label>
        Date
        <input type="date" value={itemDate} onChange={(e) => setItemDate(e.target.value)} required />
      </label>
      <label>
        Photo (optionnel)
        <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
      </label>
      <button className="btn btn-accent" type="submit" disabled={busy}>
        {busy ? 'Envoi…' : 'Déclarer'}
      </button>
    </form>
  )
}
