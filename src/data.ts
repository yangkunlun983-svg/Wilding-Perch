import type { ModuleItem, Recommendation, RoomInput, Skeleton } from './types'

export const skeletons: Skeleton[] = [
  {
    id: 'nest', name: 'The Nest', zhName: '栖木紧凑型', size: [2.0, 2.1, 2.5], minRoom: [2.6, 2.7, 2.75], price: 1280, modules: 4,
    description: 'A compact vertical frame for apartments and quiet daily movement.',
    anchors: [
      { id: 'hang-1', type: 'hang', position: [-0.45, 1.75, 0] },
      { id: 'hang-2', type: 'hang', position: [0.35, 1.75, 0] },
      { id: 'wall-1', type: 'wall', position: [-0.82, 1.05, -0.05] },
      { id: 'platform-1', type: 'platform', position: [0.76, 1.12, 0] },
    ],
  },
  {
    id: 'grove', name: 'The Grove', zhName: '林间标准型', size: [2.5, 2.35, 3.0], minRoom: [3.1, 2.95, 3.2], price: 1790, modules: 6,
    description: 'A wider frame with room for climbing, resting and shared play.',
    anchors: [
      { id: 'hang-1', type: 'hang', position: [-0.48, 1.95, 0] },
      { id: 'hang-2', type: 'hang', position: [0.38, 1.95, 0] },
      { id: 'wall-1', type: 'wall', position: [-1.02, 1.08, -0.08] },
      { id: 'wall-2', type: 'wall', position: [1.02, 1.35, -0.08] },
      { id: 'platform-1', type: 'platform', position: [0.72, 1.3, 0] },
      { id: 'platform-2', type: 'platform', position: [-0.65, 0.72, 0] },
    ],
  },
]

export const modules: ModuleItem[] = [
  { type: 'bar', name: 'Pull-up bar', zhName: '单杠', anchorType: 'hang', price: 80, color: '#d99444' },
  { type: 'rings', name: 'Rings', zhName: '吊环', anchorType: 'hang', price: 95, color: '#c97f32' },
  { type: 'swing', name: 'Swing', zhName: '秋千', anchorType: 'hang', price: 120, color: '#d8964e' },
  { type: 'climbing', name: 'Climbing wall', zhName: '攀岩板', anchorType: 'wall', price: 260, color: '#b66e35' },
  { type: 'shelf', name: 'Shelf', zhName: '置物架', anchorType: 'wall', price: 110, color: '#93613f' },
  { type: 'plank', name: 'Rest plank', zhName: '休息踏板', anchorType: 'platform', price: 145, color: '#c58d54' },
]

export function recommend(room: RoomInput): Recommendation[] {
  return skeletons.map((skeleton) => {
    const [needL, needW, needH] = skeleton.minRoom.map((v) => Math.round(v * 100))
    const margins = [room.length - needL, room.width - needW, room.height - needH]
    const fit = margins.every((value) => value >= 0)
    let score = fit ? 74 : 38
    score += Math.min(14, Math.max(-18, Math.floor(Math.min(...margins) / 8)))
    if (room.wallMount) score += 5
    if (room.obstacle === 'none') score += 4
    if (room.houseType === 'studio' && skeleton.id === 'nest') score += 4
    if (room.houseType === 'loft' && skeleton.id === 'grove') score += 4
    score = Math.max(18, Math.min(98, score))
    const reasons = [
      fit ? 'Frame envelope fits the entered room dimensions.' : 'The frame exceeds at least one room dimension.',
      skeleton.id === 'nest' ? 'Compact footprint preserves more open floor area.' : 'Wider span supports more activity modules.',
    ]
    const warnings: string[] = []
    if (!room.wallMount) warnings.push('Wall-mounted accessories are unavailable.')
    if (room.wallType === 'drywall') warnings.push('Drywall requires a verified structural fixing point.')
    if (room.obstacle !== 'none') warnings.push('Keep the selected obstacle outside the safety clearance.')
    if (!fit) warnings.push('Adjust the room dimensions or choose a smaller frame.')
    return { skeletonId: skeleton.id, score, fit, reasons, warnings, clearance: Math.max(0, Math.min(...margins)) }
  }).sort((a, b) => b.score - a.score)
}
