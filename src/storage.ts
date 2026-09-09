import { openDB } from 'idb'
import type { SavedDesign } from './types'

const database = openDB('wildling-perch', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('designs')) db.createObjectStore('designs', { keyPath: 'id' })
  },
})

export async function saveDesign(design: SavedDesign) {
  return (await database).put('designs', design)
}

export async function getDesigns(): Promise<SavedDesign[]> {
  const values = await (await database).getAll('designs')
  return values.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function deleteDesign(id: string) {
  return (await database).delete('designs', id)
}
