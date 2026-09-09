export type Page = 'intro' | 'home' | 'capture' | 'analysis' | 'results' | 'compare' | 'configure' | 'specs' | 'review' | 'cases' | 'community' | 'mine'

export type RoomInput = {
  image?: string
  imageName?: string
  length: number
  width: number
  height: number
  houseType: 'apartment' | 'loft' | 'studio'
  wallType: 'concrete' | 'brick' | 'drywall'
  wallMount: boolean
  obstacle: 'none' | 'window' | 'furniture'
}

export type Anchor = {
  id: string
  type: 'hang' | 'wall' | 'platform'
  position: [number, number, number]
}

export type Skeleton = {
  id: string
  name: string
  zhName: string
  size: [number, number, number]
  minRoom: [number, number, number]
  price: number
  modules: number
  anchors: Anchor[]
  description: string
}

export type ModuleType = 'bar' | 'rings' | 'swing' | 'climbing' | 'shelf' | 'plank'

export type ModuleItem = {
  type: ModuleType
  name: string
  zhName: string
  anchorType: Anchor['type']
  price: number
  color: string
}

export type InstalledModule = {
  id: string
  type: ModuleType
  anchorId: string
}

export type Recommendation = {
  skeletonId: string
  score: number
  fit: boolean
  reasons: string[]
  warnings: string[]
  clearance: number
}

export type SavedDesign = {
  id: string
  name: string
  createdAt: string
  room: RoomInput
  skeletonId: string
  modules: InstalledModule[]
  inquiryStatus: 'draft' | 'submitted'
}
