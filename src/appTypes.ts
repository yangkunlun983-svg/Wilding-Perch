export type Screen = 'start' | 'scan' | 'analyze' | 'check' | 'preset' | 'configure' | 'final' | 'compare' | 'know' | 'watch' | 'mine'
export type HouseType = 'small_apartment' | 'apartment' | 'large_flat' | 'loft' | 'villa'
export type ModuleKey = 'lever' | 'rings' | 'swing' | 'climbing wall' | 'shelf' | 'plank'
export type SkeletonKey = 'standard' | 'luxury'
export type PlankVariant = 'small' | 'medium' | 'large'
export type InstalledModuleKey = Exclude<ModuleKey, 'plank'> | `plank_${PlankVariant}`

export type Room = {
  image?: string
  length: number
  width: number
  height: number
  houseType: HouseType
  estimatedHomeArea: number
  confidence: 'low' | 'medium' | 'high'
  notes: string[]
  warnings: string[]
}
