import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Check, ChevronDown, ImagePlus, Lock, RotateCcw, Save, Sparkles, Trash2, X } from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import ModelPreview from './ModelPreview'
import type { HouseType, InstalledModuleKey, ModuleKey, PlankVariant, Room, SavedPreview, Screen, SkeletonKey } from './appTypes'

const A = `${import.meta.env.BASE_URL}design-assets`
const ui = (name: string) => `${A}/ui/${name}`
const render = (name: string) => `${A}/renders/${name}`

type FitSummary = {
  score: number
  label: string
  notes: string[]
  warnings: string[]
}

const modules: { key: ModuleKey, label: string, icon: string }[] = [
  { key: 'lever', label: 'lever', icon: ui('lever.png') },
  { key: 'rings', label: 'rings', icon: ui('rings.png') },
  { key: 'swing', label: 'swing', icon: ui('swing.png') },
  { key: 'climbing wall', label: 'climbing wall', icon: ui('climbing wall.png') },
  { key: 'shelf', label: 'shelf', icon: ui('shelf.png') },
  { key: 'plank', label: 'plank', icon: ui('plank.png') },
]

const introTiles = [
  {
    title: 'Room Photo Guide',
    image: ui('背景图1.png'),
    body: 'Take one clear room photo so the app can estimate open space, ceiling height, and likely fitting risks.',
  },
  {
    title: 'Floor Plan Library',
    image: ui('背景图2.png'),
    body: 'Compare prepared layouts and pick the closest room type before you start a custom setup.',
  },
  {
    title: 'Smart Scan',
    image: ui('背景图3.png'),
    body: 'Use the camera scan to generate room dimensions, confidence notes, and warnings for the next fit check.',
  },
  {
    title: '3D Preview',
    image: ui('背景图1.png'),
    body: 'Place compatible modules on the selected skeleton and preview the final result before saving.',
  },
]

function isModuleAllowed(skeleton: SkeletonKey, module: ModuleKey) {
  return skeleton === 'luxury' || module === 'swing'
}

function isInstalledModuleAllowed(skeleton: SkeletonKey, module: InstalledModuleKey) {
  return skeleton === 'luxury' || module === 'swing'
}

function isPlankModule(module: InstalledModuleKey) {
  return module.startsWith('plank_')
}

function moduleLabel(module: InstalledModuleKey) {
  return module.replace('plank_', 'plank ')
}

function presetModulesFor(skeleton: SkeletonKey): InstalledModuleKey[] {
  if (skeleton === 'standard') return ['swing']
  return ['plank_large', 'plank_medium', 'plank_small', 'lever', 'rings', 'swing', 'climbing wall', 'shelf']
}

function presetImageFor(skeleton: SkeletonKey) {
  return skeleton === 'standard' ? render('封面渲染图.png') : render('效果预览图.png')
}

const defaultRoom: Room = {
  length: 360,
  width: 320,
  height: 270,
  houseType: 'apartment',
  estimatedHomeArea: 98,
  confidence: 'low',
  notes: ['Manual dimensions are ready for a first fit check.'],
  warnings: ['Confirm ceiling height and wall fixing points before ordering.'],
}

const clampRoomValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value || min)))

function roomLabel(houseType: HouseType) {
  return houseType.replace('_', ' ')
}

function analyzeRoomImage(fileName: string, fileSize: number, image: string): Room {
  const megaPixels = Math.max(1, fileSize / 850_000)
  const name = fileName.toLowerCase()
  const likelyLarge = /loft|villa|large|living|open|客厅|大户型/.test(name) || megaPixels > 3.6
  const likelySmall = /small|bedroom|studio|compact|卧室|小户型/.test(name)
  if (likelyLarge) return {
    image,
    length: 520,
    width: 390,
    height: 285,
    houseType: name.includes('loft') ? 'loft' : 'large_flat',
    estimatedHomeArea: 158,
    confidence: 'medium',
    notes: ['Open-room cues detected.', 'Luxury can be tested because the clear span looks generous.'],
    warnings: ['This is a visual estimate. Please verify clear wall width and ceiling fixtures.'],
  }
  if (likelySmall) return {
    image,
    length: 310,
    width: 260,
    height: 250,
    houseType: 'small_apartment',
    estimatedHomeArea: 68,
    confidence: 'medium',
    notes: ['Compact-room cues detected.', 'Standard is the safer first recommendation.'],
    warnings: ['Luxury remains locked unless the manually confirmed room is larger.'],
  }
  return {
    image,
    length: Math.round(350 + megaPixels * 20),
    width: Math.round(300 + megaPixels * 12),
    height: 265,
    houseType: 'apartment',
    estimatedHomeArea: Math.round(92 + megaPixels * 8),
    confidence: 'low',
    notes: ['AI made a cautious room estimate.', 'Manual confirmation will improve the fit score.'],
    warnings: ['Photo angle is uncertain, so treat this as a planning estimate.'],
  }
}

function canUseLuxury(room: Room) {
  return room.estimatedHomeArea >= 150 || ['large_flat', 'loft', 'villa'].includes(room.houseType) || (room.length >= 450 && room.width >= 350 && room.height >= 270)
}

function getFitSummary(room: Room, skeleton: SkeletonKey): FitSummary {
  const luxury = skeleton === 'luxury'
  const needs = luxury ? { length: 450, width: 350, height: 270, area: 150 } : { length: 280, width: 240, height: 240, area: 45 }
  const margins = [room.length - needs.length, room.width - needs.width, room.height - needs.height]
  const minMargin = Math.min(...margins)
  const sizeFit = margins.every((value) => value >= 0)
  const areaFit = room.estimatedHomeArea >= needs.area
  const unlocked = !luxury || canUseLuxury(room)
  const score = Math.max(18, Math.min(98, 62 + Math.floor(minMargin / 5) + (areaFit ? 12 : -8) + (unlocked ? 8 : -16)))
  const warnings = [...room.warnings]
  if (!sizeFit) warnings.unshift(`Needs at least ${needs.length} x ${needs.width} x ${needs.height} cm clear space.`)
  if (luxury && !unlocked) warnings.unshift('Luxury is locked for this room size.')
  return {
    score,
    label: unlocked && sizeFit ? 'fit checked' : 'needs review',
    notes: [
      `${room.length} x ${room.width} x ${room.height} cm room envelope`,
      `${roomLabel(room.houseType)} · about ${room.estimatedHomeArea} sqm`,
      unlocked ? 'Skeleton is available for this estimate.' : 'Choose Standard or update room dimensions.',
    ],
    warnings: Array.from(new Set(warnings)).slice(0, 3),
  }
}

function StatusBar() {
  return <div className="status-bar" aria-hidden="true" />
}

function AssetButton({ image, label, onClick, disabled = false }: { image: string, label: string, onClick: () => void, disabled?: boolean }) {
  return <button className="asset-button" onClick={onClick} disabled={disabled} aria-label={label}><img src={image} alt="" /><span>{label}</span></button>
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <AssetButton image={ui('back.png')} label="back" onClick={onClick} />
}

function BottomNav({ current, go }: { current: Screen, go: (screen: Screen) => void }) {
  const items: { screen: Screen, icon: string, label: string }[] = [
    { screen: 'start', icon: ui('底部导航图标1.png'), label: 'customization' },
    { screen: 'watch', icon: ui('底部导航图标2.png'), label: 'cases' },
    { screen: 'compare', icon: ui('底部导航图标3.png'), label: 'community' },
    { screen: 'mine', icon: ui('底部导航图标4.png'), label: 'Mine' },
  ]
  return <nav className="bottom-tabs">{items.map((item) => <button key={item.label} className={current === item.screen ? 'active' : ''} onClick={() => go(item.screen)}><img src={item.icon} alt="" /><span>{item.label}</span></button>)}</nav>
}

function ScreenShell({ children, screen, go, showNav = false }: { children: ReactNode, screen: Screen, go: (screen: Screen) => void, showNav?: boolean }) {
  return <div className="phone-canvas"><StatusBar />{children}{showNav && <BottomNav current={screen} go={go} />}</div>
}

function StartScreen({ start, go }: { start: () => void, go: (screen: Screen) => void }) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeTile, setActiveTile] = useState<(typeof introTiles)[number] | undefined>()
  const loopTiles = [...introTiles, ...introTiles, ...introTiles]
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return
    const third = carousel.scrollWidth / 3
    carousel.scrollLeft = third
    const loop = () => {
      if (carousel.scrollLeft < third * .45) carousel.scrollLeft += third
      if (carousel.scrollLeft > third * 1.55) carousel.scrollLeft -= third
    }
    carousel.addEventListener('scroll', loop, { passive: true })
    return () => carousel.removeEventListener('scroll', loop)
  }, [])
  return <ScreenShell screen="start" go={go} showNav>
    <section className="start-screen">
      <motion.div className="hero-render" initial={{ scale: 1.04 }} animate={{ scale: 1 }} transition={{ duration: .8 }}>
        <img src={render('封面渲染图.png')} alt="Wildling Perch interior render" />
      </motion.div>
      <div className="brand-ghost">Wildling<br />Perch</div>
      <motion.div className="start-cta" whileTap={{ scale: .94 }}><AssetButton image={ui('START按钮.png')} label="START" onClick={start} /></motion.div>
      <div className="tile-carousel" ref={carouselRef} aria-label="Intro cards">
        {loopTiles.map((tile, index) => <motion.button
          key={`${tile.title}-${index}`}
          className="intro-tile"
          style={{ '--tile-bg': `url("${tile.image}")` } as CSSProperties}
          onClick={() => setActiveTile(tile)}
          whileTap={{ scale: .94 }}
          aria-label={tile.title}
        >
          <span>{tile.title.split(' ').map((word, wordIndex, words) => <Fragment key={`${word}-${wordIndex}`}>{word}{wordIndex < words.length - 1 && <br />}</Fragment>)}</span>
        </motion.button>)}
      </div>
      {activeTile && <div className="intro-modal" role="dialog" aria-label={activeTile.title}>
        <motion.div initial={{ scale: .92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}>
          <button className="modal-close" onClick={() => setActiveTile(undefined)} aria-label="close"><X /></button>
          <img src={activeTile.image} alt={activeTile.title} />
          <h2>{activeTile.title}</h2>
          <p>{activeTile.body}</p>
        </motion.div>
      </div>}
    </section>
  </ScreenShell>
}

function InlineCameraPreview({ fallback, onCapture }: { fallback: string, onCapture: (image: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    let alive = true
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }).then(async (stream) => {
      if (!alive) return
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setState('ready')
    }).catch(() => setState('error'))
    return () => { alive = false; streamRef.current?.getTracks().forEach((track) => track.stop()) }
  }, [])
  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    onCapture(canvas.toDataURL('image/jpeg', .88))
  }
  return <>
    {state === 'error' ? <img src={fallback} alt="Room scan preview" /> : <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview" />}
    <img className="scan-frame" src={ui('扫描框.png')} alt="" />
    {state === 'loading' && <p className="camera-state">opening camera...</p>}
    {state === 'error' && <p className="camera-state">camera unavailable, please upload a room image</p>}
    <button className="inline-shutter" onClick={capture} disabled={state !== 'ready'} aria-label="capture room"><Camera /></button>
  </>
}

function ScanScreen({ room, setRoom, startAnalysis, go }: { room: Room, setRoom: (room: Room) => void, startAnalysis: (room: Room) => void, go: (screen: Screen) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const fit = getFitSummary(room, 'standard')
  const analyze = (payload: { name: string, size: number, image: string }) => startAnalysis(analyzeRoomImage(payload.name, payload.size, payload.image))
  const updateRoom = (patch: Partial<Room>) => setRoom({ ...room, ...patch })
  const readFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => analyze({ name: file.name, size: file.size, image: String(reader.result) })
    reader.readAsDataURL(file)
  }
  return <ScreenShell screen="scan" go={go}>
    <section className="scan-screen">
      <div className="scan-photo">
        {room.image ? <img src={room.image} alt="Room scan preview" /> : <InlineCameraPreview fallback={ui('首页背景图.png')} onCapture={(image) => analyze({ name: 'camera-large-room.jpg', size: 3_200_000, image })} />}
      </div>
      <div className="scan-panel">
        <div className="scan-actions"><button onClick={() => inputRef.current?.click()}><ImagePlus /> upload</button><input ref={inputRef} type="file" accept="image/*" hidden onChange={(event) => readFile(event.target.files?.[0])} /></div>
        <h2>Input it yourself</h2>
        <DimensionField label="length" value={room.length} min={180} max={800} onChange={(value) => updateRoom({ length: value })} />
        <DimensionField label="width" value={room.width} min={160} max={700} onChange={(value) => updateRoom({ width: value })} />
        <DimensionField label="height" value={room.height} min={220} max={420} onChange={(value) => updateRoom({ height: value })} />
        <label className="pill-select"><span>Common house types</span><select value={room.houseType} onChange={(event) => updateRoom({ houseType: event.target.value as HouseType })}><option value="small_apartment">small apartment</option><option value="apartment">apartment</option><option value="large_flat">large flat</option><option value="loft">loft</option><option value="villa">villa</option></select><ChevronDown /></label>
        <div className="ai-card"><Sparkles /><p><strong>AI estimate: {room.confidence} · {fit.score}%</strong>{room.estimatedHomeArea} sqm approx. {room.notes[0]} {fit.warnings[0]}</p></div>
        <div className="scan-footer"><BackButton onClick={() => go('start')} /><button className="text-action primary-action" onClick={() => startAnalysis({ ...room, confidence: room.image ? room.confidence : 'medium', notes: room.image ? room.notes : ['Manual dimensions confirmed for the fit check.'] })}><Sparkles /> Analyze room</button></div>
      </div>
    </section>
  </ScreenShell>
}

function AnalyzeScreen({ complete }: { complete: () => void }) {
  const stages = ['detecting room edges', 'estimating clear size', 'checking house type', 'matching skeleton safety']
  useEffect(() => {
    const timer = window.setTimeout(complete, 1600)
    return () => window.clearTimeout(timer)
  }, [complete])
  return <ScreenShell screen="analyze" go={() => undefined}>
    <section className="analyze-screen">
      <motion.div className="scan-orbit" animate={{ rotate: 360 }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}><Sparkles /></motion.div>
      <h1>AI check</h1>
      <div className="analyze-list">{stages.map((stage, i) => <motion.p key={stage} initial={{ opacity: .2, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .28 }}><Check />{stage}</motion.p>)}</div>
      <button className="skip-analysis" onClick={complete}>show results</button>
    </section>
  </ScreenShell>
}

function ResultScreen({ room, go }: { room: Room, go: (screen: Screen) => void }) {
  const fit = getFitSummary(room, 'standard')
  return <ScreenShell screen="result" go={go}><section className="result-screen">
    <div className="result-heading"><Sparkles /><h1>Room result</h1><p>{room.confidence} confidence estimate</p></div>
    {room.image && <img className="result-photo" src={room.image} alt="Analyzed room" />}
    <div className="cream-panel result-card"><h2>{roomLabel(room.houseType)}</h2><strong>{room.length} × {room.width} × {room.height} cm</strong><p>About {room.estimatedHomeArea} sqm · Standard {fit.score}% match</p>{room.notes.map((note) => <p key={note}><Check /> {note}</p>)}{room.warnings.map((warning) => <p className="warning-line" key={warning}>{warning}</p>)}</div>
    <div className="result-actions"><button className="text-action" onClick={() => go('scan')}>Edit room</button><AssetButton image={ui('next.png')} label="continue to skeletons" onClick={() => go('check')} /></div>
  </section></ScreenShell>
}

function DimensionField({ label, value, min, max, onChange }: { label: string, value: number, min: number, max: number, onChange: (value: number) => void }) {
  const invalid = value < min || value > max
  return <label className={`pill-input ${invalid ? 'invalid' : ''}`}><span>{label}</span><input value={value} type="number" min={min} max={max} onBlur={(event) => onChange(clampRoomValue(Number(event.target.value), min, max))} onChange={(event) => onChange(Number(event.target.value))} /><em>cm</em></label>
}

function CheckScreen({ room, selected, setSelected, go }: { room: Room, selected: SkeletonKey, setSelected: (key: SkeletonKey) => void, go: (screen: Screen) => void }) {
  const standardFit = getFitSummary(room, 'standard')
  const luxuryFit = getFitSummary(room, 'luxury')
  const luxury = canUseLuxury(room)
  return <ScreenShell screen="check" go={go}>
    <section className="check-screen">
      <div className="floating-model"><ModelPreview skeleton={selected} modules={[]} /><h1>check!</h1></div>
      <div className="mini-actions"><AssetButton image={ui('specs.png')} label="Specs" onClick={() => go('know')} /><AssetButton image={ui('fit.png')} label="Fit details" onClick={() => go('fit')} /><AssetButton image={ui('next.png')} label="next" onClick={() => go('preset')} /></div>
      <div className="cream-panel"><h2>Select the skeleton you like</h2><SkeletonChoice id="standard" active={selected === 'standard'} unlocked score={standardFit.score} onClick={() => setSelected('standard')} note={standardFit.notes[2]} /><SkeletonChoice id="luxury" active={selected === 'luxury'} unlocked={luxury} score={luxuryFit.score} onClick={() => luxury && setSelected('luxury')} note={luxury ? luxuryFit.notes[2] : 'Recommended for 150 sqm+ homes or 450 x 350 cm clear rooms.'} /><div className="fit-notes">{getFitSummary(room, selected).warnings.map((warning) => <p key={warning}>{warning}</p>)}</div></div>
    </section>
  </ScreenShell>
}

function FitScreen({ room, selected, go }: { room: Room, selected: SkeletonKey, go: (screen: Screen) => void }) {
  const fit = getFitSummary(room, selected)
  return <ScreenShell screen="fit" go={go}><section className="fit-screen"><h1>Fit details</h1><div className="cream-panel"><h2>{selected} · {fit.score}%</h2><strong>{fit.label}</strong>{fit.notes.map((note) => <p key={note}><Check /> {note}</p>)}{fit.warnings.map((warning) => <p className="warning-line" key={warning}>{warning}</p>)}</div><BackButton onClick={() => go('check')} /></section></ScreenShell>
}

function SkeletonChoice({ id, active, unlocked, score, onClick, note }: { id: SkeletonKey, active: boolean, unlocked: boolean, score: number, onClick: () => void, note: string }) {
  return <button className={`skeleton-choice ${active ? 'active' : ''}`} onClick={onClick} aria-label={id}><span>{id}</span><strong>{score}% match</strong><em>{note}</em>{!unlocked && <Lock size={26} />}</button>
}

function PresetScreen({ selected, usePreset, goManual, go }: { selected: SkeletonKey, usePreset: () => void, goManual: () => void, go: (screen: Screen) => void }) {
  const preset = presetModulesFor(selected)
  return <ScreenShell screen="preset" go={go}>
    <section className="preset-screen">
      <div className="preset-hero">
        <img src={presetImageFor(selected)} alt={`${selected} preset case preview`} />
        <h1>preset case?</h1>
      </div>
      <div className="preset-panel">
        <h2>{selected} ready case</h2>
        <p>Use the prepared case to load every compatible module and preview the full effect immediately.</p>
        <p>{preset.length} modules: {preset.map(moduleLabel).join(', ')}</p>
        <div>
          <BackButton onClick={() => go('check')} />
          <button className="text-action" onClick={goManual}>customize</button>
          <AssetButton image={ui('next.png')} label="preview case" onClick={usePreset} />
        </div>
      </div>
    </section>
  </ScreenShell>
}

function ConfigureScreen({ selected, pickedModules, setPickedModules, go, goFinal }: { selected: SkeletonKey, pickedModules: InstalledModuleKey[], setPickedModules: (items: InstalledModuleKey[]) => void, go: (screen: Screen) => void, goFinal: () => void }) {
  const [selectedModule, setSelectedModule] = useState<ModuleKey | undefined>()
  const [forcedPlankVariant, setForcedPlankVariant] = useState<PlankVariant | undefined>()
  const [dependencyPrompt, setDependencyPrompt] = useState<ModuleKey | undefined>()
  const [pendingModuleAfterPlank, setPendingModuleAfterPlank] = useState<ModuleKey | undefined>()
  const [placementMessage, setPlacementMessage] = useState('')
  const hasLargePlank = pickedModules.includes('plank_large')
  const requestLargePlankFirst = (key: ModuleKey) => {
    setDependencyPrompt(key)
    setSelectedModule(undefined)
    setForcedPlankVariant(undefined)
    setPlacementMessage('')
  }
  const startLargePlankPlacement = () => {
    if (!dependencyPrompt) return
    setPendingModuleAfterPlank(dependencyPrompt)
    setDependencyPrompt(undefined)
    setSelectedModule('plank')
    setForcedPlankVariant('large')
    setPlacementMessage(`${dependencyPrompt} needs a support point. Place plank large first.`)
  }
  const install = (key: ModuleKey, variant?: PlankVariant) => {
    if (!isModuleAllowed(selected, key)) return
    if (selected === 'luxury' && (key === 'swing' || key === 'rings') && !hasLargePlank) {
      requestLargePlankFirst(key)
      return
    }
    const plankVariant = key === 'plank' ? forcedPlankVariant || variant : undefined
    const installedKey: InstalledModuleKey | undefined = key === 'plank' ? (plankVariant ? `plank_${plankVariant}` : undefined) : key
    if (!installedKey) return
    if (!pickedModules.includes(installedKey)) setPickedModules([...pickedModules, installedKey])
    if (key === 'plank' && forcedPlankVariant && pendingModuleAfterPlank) {
      setForcedPlankVariant(undefined)
      setSelectedModule(pendingModuleAfterPlank)
      setPlacementMessage(`Plank large installed. Tap place to install ${pendingModuleAfterPlank}.`)
      setPendingModuleAfterPlank(undefined)
      return
    }
    setPlacementMessage(key === 'plank' ? `Plank ${plankVariant} installed.` : `${key} installed.`)
    setForcedPlankVariant(undefined)
    setSelectedModule(undefined)
  }
  const remove = (key: ModuleKey) => {
    const next = key === 'plank' ? pickedModules.filter((item) => !isPlankModule(item)) : pickedModules.filter((item) => item !== key)
    setPickedModules(next)
  }
  const removeInstalled = (key: InstalledModuleKey) => setPickedModules(pickedModules.filter((item) => item !== key))
  const chooseModule = (key: ModuleKey, alreadyPicked: boolean) => {
    if (key === 'plank') {
      setPlacementMessage('')
      setSelectedModule('plank')
      setForcedPlankVariant(undefined)
      setPendingModuleAfterPlank(undefined)
      return
    }
    if (alreadyPicked) {
      remove(key)
      return
    }
    if (selected === 'luxury' && (key === 'swing' || key === 'rings') && !hasLargePlank) {
      requestLargePlankFirst(key)
      return
    }
    setPlacementMessage('')
    setForcedPlankVariant(undefined)
    setPendingModuleAfterPlank(undefined)
    setSelectedModule(key)
  }
  useEffect(() => {
    const allowed = pickedModules.filter((item) => isInstalledModuleAllowed(selected, item))
    if (allowed.length !== pickedModules.length) setPickedModules(allowed)
    if (selected === 'luxury' && !allowed.includes('plank_large') && allowed.some((item) => item === 'swing' || item === 'rings')) {
      setPickedModules(allowed.filter((item) => item !== 'swing' && item !== 'rings'))
      setPlacementMessage('Swing and rings require plank large.')
    }
    if (selectedModule && !isModuleAllowed(selected, selectedModule)) {
      setSelectedModule(undefined)
      setForcedPlankVariant(undefined)
      setPendingModuleAfterPlank(undefined)
    }
  }, [pickedModules, selected, selectedModule, setPickedModules])
  return <ScreenShell screen="configure" go={go}>
    <section className="configure-screen">
      <div className="live-model-stage"><ModelPreview skeleton={selected} modules={pickedModules} selectedModule={selectedModule} forcedPlankVariant={forcedPlankVariant} onInstall={install} /><motion.h1 key={pickedModules.length} initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>{pickedModules.length ? 'suit!' : 'try!'}</motion.h1></div>
      <div className="module-panel"><p className="placement-hint">{placementMessage || (selected === 'standard' ? 'Standard supports swing only. Choose Luxury for all modules.' : selectedModule === 'plank' ? (forcedPlankVariant ? 'Place plank large to create support points.' : 'Choose one plank point: small, medium, or large.') : selectedModule ? `Tap place on the model to install ${selectedModule}.` : 'Choose a module, then place it on the model.')}</p><div className="module-grid">{modules.map((item) => {
        const allowed = isModuleAllowed(selected, item.key)
        const alreadyPicked = item.key === 'plank' ? pickedModules.some(isPlankModule) : pickedModules.includes(item.key)
        return <button key={item.key} disabled={!allowed} className={`${selectedModule === item.key || alreadyPicked ? 'picked' : ''} ${!allowed ? 'locked' : ''}`} onClick={() => chooseModule(item.key, alreadyPicked)} aria-label={allowed ? item.label : `${item.label} locked for standard`}><img src={item.icon} alt="" /><span>{item.label}</span>{alreadyPicked && <Check />}{!allowed && <Lock />}</button>
      })}</div>{pickedModules.length > 0 && <div className="installed-list"><strong>Installed</strong>{pickedModules.map((item) => <button key={item} onClick={() => removeInstalled(item)} aria-label={`remove ${moduleLabel(item)}`}><span><Check /> {moduleLabel(item)}</span><X /></button>)}</div>}<div className="module-tools"><button onClick={() => setPickedModules(pickedModules.slice(0, -1))} disabled={!pickedModules.length}><RotateCcw /> undo</button><button onClick={() => setPickedModules([])} disabled={!pickedModules.length}><Trash2 /> clear</button></div><div className="panel-footer"><BackButton onClick={() => go('preset')} /><AssetButton image={ui('next.png')} label="final preview" onClick={goFinal} disabled={!pickedModules.length} /></div></div>
      {dependencyPrompt && <div className="dependency-modal" role="dialog" aria-label="support point required">
        <div>
          <h2>Support point required</h2>
          <p>{dependencyPrompt} needs plank large first, because it provides the load-bearing support point for installation.</p>
          <div className="dependency-actions"><button className="text-action" onClick={() => setDependencyPrompt(undefined)}>cancel</button><button onClick={startLargePlankPlacement}>install plank large</button></div>
        </div>
      </div>}
    </section>
  </ScreenShell>
}

function FinalScreen({ room, selected, pickedModules, presetPreview, saved, savePreview, go }: { room: Room, selected: SkeletonKey, pickedModules: InstalledModuleKey[], presetPreview: boolean, saved: boolean, savePreview: () => void, go: (screen: Screen) => void }) {
  const fit = getFitSummary(room, selected)
  return <ScreenShell screen="final" go={go}>
    <section className="final-screen">
      <div className={`final-model ${presetPreview ? 'case-render' : ''}`}>{presetPreview ? <img src={presetImageFor(selected)} alt={`${selected} final case render`} /> : <ModelPreview skeleton={selected} modules={pickedModules} final />}<h1>preview</h1></div>
      <div className="final-card"><h2>Final effect</h2><p>{selected} skeleton · {fit.score}% {fit.label}</p><p>{pickedModules.length || 0} modules: {pickedModules.map(moduleLabel).join(', ') || 'base frame'}</p><p>{room.length} x {room.width} x {room.height} cm · {room.estimatedHomeArea} sqm</p>{fit.warnings.map((warning) => <p className="warning-line" key={warning}>{warning}</p>)}<div className="final-actions"><BackButton onClick={() => go(presetPreview ? 'preset' : 'configure')} />{!saved && <button className="text-action primary-action" onClick={savePreview}><Save /> Save preview</button>}</div>{saved && <div className="save-success"><p className="save-toast">Preview saved to Mine.</p><button className="text-action" onClick={() => go('mine')}>View in Mine</button><button className="text-action" onClick={() => go('start')}>Back home</button></div>}</div>
    </section>
  </ScreenShell>
}

function CompareScreen({ go }: { go: (screen: Screen) => void }) {
  const [active, setActive] = useState<string>()
  const discussions = [{ title: 'Parent setup notes', body: 'Which module combo works best for a shared living room?', replies: 18 }, { title: 'Safety check', body: 'How do you confirm the wall fixing points before installing rings?', replies: 9 }, { title: 'Room ideas', body: 'Share your color, storage, and play-zone layout after preview.', replies: 24 }]
  return <ScreenShell screen="compare" go={go} showNav><section className="compare-screen community-screen"><h1>community</h1><div className="discussion-list">{discussions.map((item) => <button key={item.title} onClick={() => setActive(item.title)}><article><strong>{item.title}</strong><p>{item.body}</p><span>{item.replies} replies · open thread</span></article></button>)}</div>{active && <div className="community-thread" role="dialog" aria-label={active}><button className="modal-close" onClick={() => setActive(undefined)} aria-label="close"><X /></button><h2>{active}</h2><p>This demo thread shows where comments, installation photos, and replies will live.</p></div>}</section></ScreenShell>
}

function KnowScreen({ selected, go }: { selected: SkeletonKey, go: (screen: Screen) => void }) {
  return <ScreenShell screen="know" go={go}><section className="know-screen"><h1>{selected} Specs</h1><div className="spec-sheet"><img src={selected === 'luxury' ? render('luxury-specs.png') : render('封面渲染图.png')} alt={`${selected} frame specification`} /></div><div className="orange-band"><BackButton onClick={() => go('check')} /></div></section></ScreenShell>
}

function WatchScreen({ useCase, go }: { useCase: (skeleton: SkeletonKey) => void, go: (screen: Screen) => void }) {
  return <ScreenShell screen="watch" go={go} showNav><section className="watch-screen"><img src={render('效果预览图.png')} alt="presentation render" /><h1>cases</h1><div className="case-options"><article><h2>Compact Standard</h2><p>Standard frame with swing for smaller living rooms.</p><button className="text-action" onClick={() => useCase('standard')}>Use this setup</button></article><article><h2>Open-room Luxury</h2><p>Full prepared Luxury case with every compatible module.</p><button className="text-action" onClick={() => useCase('luxury')}>Use this setup</button></article></div></section></ScreenShell>
}

function MineScreen({ saved, resume, go }: { saved: SavedPreview[], resume: (item: SavedPreview) => void, go: (screen: Screen) => void }) {
  return <ScreenShell screen="mine" go={go} showNav><section className="mine-screen"><h1>Mine</h1><div className="cream-panel"><h2>Saved ideas</h2>{saved.length === 0 ? <p>No saved previews yet. Finish a configuration and choose Save preview.</p> : saved.map((item) => <article className="saved-preview" key={item.id}><strong>{item.skeleton} · {item.modules.length} modules</strong><p>{item.room.length} × {item.room.width} × {item.room.height} cm</p><small>{new Date(item.createdAt).toLocaleString()}</small><button className="text-action" onClick={() => resume(item)}>Open preview</button></article>)}</div></section></ScreenShell>
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [room, setRoom] = useState<Room>(defaultRoom)
  const [selected, setSelected] = useState<SkeletonKey>('standard')
  const [pickedModules, setPickedModules] = useState<InstalledModuleKey[]>([])
  const [presetPreview, setPresetPreview] = useState(false)
  const [previewSaved, setPreviewSaved] = useState(false)
  const [savedPreviews, setSavedPreviews] = useState<SavedPreview[]>(() => {
    try { return JSON.parse(localStorage.getItem('wildling-perch-previews') || '[]') as SavedPreview[] } catch { return [] }
  })
  useEffect(() => {
    setPickedModules((items) => items.filter((item) => isInstalledModuleAllowed(selected, item)))
  }, [selected])
  const go = (next: Screen) => setScreen(next)
  const startNew = () => {
    setPickedModules([])
    setPresetPreview(false)
    setPreviewSaved(false)
    setScreen('scan')
  }
  const startAnalysis = (nextRoom: Room) => {
    setRoom(nextRoom)
    setScreen('analyze')
  }
  const goManualConfigure = () => {
    setPresetPreview(false)
    setPreviewSaved(false)
    setScreen('configure')
  }
  const goFinalManual = () => {
    setPresetPreview(false)
    setPreviewSaved(false)
    setScreen('final')
  }
  const usePresetCase = () => {
    setPickedModules(presetModulesFor(selected))
    setPresetPreview(true)
    setPreviewSaved(false)
    setScreen('final')
  }
  const useLibraryCase = (skeleton: SkeletonKey) => {
    setSelected(skeleton)
    setPickedModules(presetModulesFor(skeleton))
    setPresetPreview(true)
    setPreviewSaved(false)
    setScreen('final')
  }
  const savePreview = () => {
    const { image: _image, ...savedRoom } = room
    const item: SavedPreview = { id: `${Date.now()}`, createdAt: new Date().toISOString(), room: savedRoom, skeleton: selected, modules: pickedModules, presetPreview }
    const next = [item, ...savedPreviews].slice(0, 12)
    setSavedPreviews(next)
    setPreviewSaved(true)
    try { localStorage.setItem('wildling-perch-previews', JSON.stringify(next)) } catch { /* Keep the session save when storage is unavailable. */ }
  }
  const resumePreview = (item: SavedPreview) => {
    setRoom(item.room)
    setSelected(item.skeleton)
    setPickedModules(item.modules)
    setPresetPreview(item.presetPreview)
    setPreviewSaved(true)
    setScreen('final')
  }
  const rendered = useMemo(() => {
    if (screen === 'scan') return <ScanScreen room={room} setRoom={setRoom} startAnalysis={startAnalysis} go={go} />
    if (screen === 'analyze') return <AnalyzeScreen complete={() => go('result')} />
    if (screen === 'result') return <ResultScreen room={room} go={go} />
    if (screen === 'check') return <CheckScreen room={room} selected={selected} setSelected={setSelected} go={go} />
    if (screen === 'fit') return <FitScreen room={room} selected={selected} go={go} />
    if (screen === 'preset') return <PresetScreen selected={selected} usePreset={usePresetCase} goManual={goManualConfigure} go={go} />
    if (screen === 'configure') return <ConfigureScreen selected={selected} pickedModules={pickedModules} setPickedModules={setPickedModules} go={go} goFinal={goFinalManual} />
    if (screen === 'final') return <FinalScreen room={room} selected={selected} pickedModules={pickedModules} presetPreview={presetPreview} saved={previewSaved} savePreview={savePreview} go={go} />
    if (screen === 'compare') return <CompareScreen go={go} />
    if (screen === 'know') return <KnowScreen selected={selected} go={go} />
    if (screen === 'watch') return <WatchScreen useCase={useLibraryCase} go={go} />
    if (screen === 'mine') return <MineScreen saved={savedPreviews} resume={resumePreview} go={go} />
    return <StartScreen start={startNew} go={go} />
  }, [screen, room, selected, pickedModules, presetPreview, savedPreviews, previewSaved])
  return <main className="desktop-stage"><AnimatePresence mode="wait"><motion.div key={screen} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .24 }}>{rendered}</motion.div></AnimatePresence></main>
}
