import { supabase } from './supabase'

export async function uploadTripPhoto(file: File, metadata: { uploader: string; day: number; place: string; time: string; caption: string }) {
  if (!supabase) return null
  const safeName = file.name.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()
  const path = `day-${metadata.day}/${Date.now()}-${safeName}`
  const upload = await supabase.storage.from('trip-photos').upload(path, file, { contentType: file.type, upsert: false })
  if (upload.error) throw upload.error
  const publicUrl = supabase.storage.from('trip-photos').getPublicUrl(path).data.publicUrl
  const record = await supabase.from('photos').insert({ storage_path: path, uploaded_by: metadata.uploader, trip_day: metadata.day, place: metadata.place, caption: `${metadata.time} · ${metadata.caption}` }).select('id').single()
  if (record.error) throw record.error
  return { publicUrl, id: record.data.id as string }
}
