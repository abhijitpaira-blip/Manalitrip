import { supabase } from './supabase'

function clamp(v: number) {
  return Math.max(0, Math.min(255, v))
}

function percentileValue(hist: Uint32Array, p: number, n: number) {
  const target = p * n
  let cum = 0
  for (let v = 0; v < 256; v++) {
    cum += hist[v]
    if (cum >= target) return v
  }
  return 255
}

function stretch(v: number, lo: number, hi: number) {
  if (hi <= lo) return clamp(v)
  return clamp(((v - lo) / (hi - lo)) * 255)
}

// Local, non-generative photo enhancement: gentle white balance, auto-levels,
// contrast, saturation and a light sharpening pass. Never touches structure,
// faces or scene content - pure deterministic pixel math, runs fully on-device.
async function enhancePhotoFile(file: File): Promise<File> {
  try {
    if (!file.type.startsWith('image/')) return file
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0)
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = img.data
    const n = d.length / 4

    const histR = new Uint32Array(256), histG = new Uint32Array(256), histB = new Uint32Array(256)
    let sumR = 0, sumG = 0, sumB = 0
    for (let i = 0; i < d.length; i += 4) {
      histR[d[i]]++; histG[d[i + 1]]++; histB[d[i + 2]]++
      sumR += d[i]; sumG += d[i + 1]; sumB += d[i + 2]
    }
    const meanR = sumR / n, meanG = sumG / n, meanB = sumB / n
    const grayMean = (meanR + meanG + meanB) / 3
    const wbStrength = 0.45
    const clampGain = (g: number) => Math.max(0.85, Math.min(1.18, g))
    const gR = clampGain(1 + wbStrength * ((grayMean / Math.max(meanR, 1)) - 1))
    const gG = clampGain(1 + wbStrength * ((grayMean / Math.max(meanG, 1)) - 1))
    const gB = clampGain(1 + wbStrength * ((grayMean / Math.max(meanB, 1)) - 1))

    const loR = percentileValue(histR, 0.005, n), hiR = percentileValue(histR, 0.995, n)
    const loG = percentileValue(histG, 0.005, n), hiG = percentileValue(histG, 0.995, n)
    const loB = percentileValue(histB, 0.005, n), hiB = percentileValue(histB, 0.995, n)

    const contrast = 1.06, satBoost = 1.1
    for (let i = 0; i < d.length; i += 4) {
      let r = stretch(d[i] * gR, loR, hiR)
      let g = stretch(d[i + 1] * gG, loG, hiG)
      let b = stretch(d[i + 2] * gB, loB, hiB)
      const avg = (r + g + b) / 3
      r = clamp((r - avg) * contrast + avg)
      g = clamp((g - avg) * contrast + avg)
      b = clamp((b - avg) * contrast + avg)
      const lum = r * 0.299 + g * 0.587 + b * 0.114
      d[i] = clamp(lum + (r - lum) * satBoost)
      d[i + 1] = clamp(lum + (g - lum) * satBoost)
      d[i + 2] = clamp(lum + (b - lum) * satBoost)
    }

    const w = canvas.width, h = canvas.height
    if (w * h <= 3000000) {
      const base = new Uint8ClampedArray(d)
      const amount = 0.3
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4
          for (let ch = 0; ch < 3; ch++) {
            let sum = 0
            for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) sum += base[((y + ky) * w + (x + kx)) * 4 + ch]
            const blur = sum / 9, orig = base[idx + ch]
            d[idx + ch] = clamp(orig + (orig - blur) * amount)
          }
        }
      }
    }

    ctx.putImageData(img, 0, 0)
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92))
    if (!blob) return file
    const newName = file.name.replace(/\.(png|heic|heif|webp)$/i, '.jpg')
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export async function uploadTripPhoto(file: File, metadata: { uploader: string; day: number; place: string; time: string; caption: string }) {
  if (!supabase) return null
  const enhancedFile = await enhancePhotoFile(file)
  const safeName = enhancedFile.name.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()
  const path = `day-${metadata.day}/${Date.now()}-${safeName}`
  const upload = await supabase.storage.from('trip-photos').upload(path, enhancedFile, { contentType: enhancedFile.type, upsert: false })
  if (upload.error) throw upload.error
  const publicUrl = supabase.storage.from('trip-photos').getPublicUrl(path).data.publicUrl
  const record = await supabase.from('photos').insert({ storage_path: path, uploaded_by: metadata.uploader, trip_day: metadata.day, place: metadata.place, caption: `${metadata.time} · ${metadata.caption}` }).select('id').single()
  if (record.error) throw record.error
  return { publicUrl, id: record.data.id as string }
}
