import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { modules } from './data'
import type { Anchor, InstalledModule, ModuleType, Skeleton } from './types'

const METAL = '#d7d8d1'
const WOOD = '#b97b3f'
const ORANGE = '#f28a32'

function Beam({ position, scale }: { position: [number, number, number], scale: [number, number, number] }) {
  return <RoundedBox position={position} scale={scale} radius={0.04} smoothness={3} castShadow receiveShadow><meshStandardMaterial color={METAL} metalness={0.55} roughness={0.28} /></RoundedBox>
}

function Frame({ skeleton }: { skeleton: Skeleton }) {
  const wide = skeleton.id === 'grove' ? 1.2 : 0.96
  const high = skeleton.id === 'grove' ? 2.12 : 1.92
  return <group>
    <Beam position={[-wide, high / 2, -0.5]} scale={[0.08, high, 0.08]} />
    <Beam position={[wide, high / 2, -0.5]} scale={[0.08, high, 0.08]} />
    <Beam position={[-wide, high / 2, 0.5]} scale={[0.08, high, 0.08]} />
    <Beam position={[wide, high / 2, 0.5]} scale={[0.08, high, 0.08]} />
    <Beam position={[0, high, -0.5]} scale={[wide * 2.05, 0.08, 0.08]} />
    <Beam position={[0, high, 0.5]} scale={[wide * 2.05, 0.08, 0.08]} />
    <Beam position={[-wide, high, 0]} scale={[0.08, 0.08, 1.08]} />
    <Beam position={[wide, high, 0]} scale={[0.08, 0.08, 1.08]} />
    <Beam position={[0, 0.04, -0.5]} scale={[wide * 2.1, 0.06, 0.08]} />
    <Beam position={[0, 0.04, 0.5]} scale={[wide * 2.1, 0.06, 0.08]} />
    <group position={[-wide + 0.05, 0.72, -0.44]}>
      {[0, 0.28, 0.56, 0.84].map((y) => <Beam key={y} position={[0.32, y, 0]} scale={[0.66, 0.055, 0.055]} />)}
    </group>
    <RoundedBox position={[-wide + 0.34, 0.35, 0.22]} scale={[0.6, 0.16, 0.62]} radius={0.05} castShadow><meshStandardMaterial color={WOOD} roughness={0.55} /></RoundedBox>
  </group>
}

function Ropes({ x = 0, top = 1.9, bottom = 0.85 }: { x?: number, top?: number, bottom?: number }) {
  return <>
    <mesh position={[x - 0.18, (top + bottom) / 2, 0]}><cylinderGeometry args={[0.012, 0.012, top - bottom, 10]} /><meshStandardMaterial color="#c98238" /></mesh>
    <mesh position={[x + 0.18, (top + bottom) / 2, 0]}><cylinderGeometry args={[0.012, 0.012, top - bottom, 10]} /><meshStandardMaterial color="#c98238" /></mesh>
  </>
}

function ModuleMesh({ type, position, ghost = false }: { type: ModuleType, position: [number, number, number], ghost?: boolean }) {
  const material = <meshStandardMaterial color={ghost ? '#f5c85a' : WOOD} transparent opacity={ghost ? 0.68 : 1} roughness={0.5} />
  if (type === 'swing') return <group position={position}><Ropes top={0.12} bottom={-0.62} /><RoundedBox position={[0, -0.67, 0]} scale={[0.54, 0.08, 0.25]} radius={0.04}>{material}</RoundedBox></group>
  if (type === 'rings') return <group position={position}><Ropes top={0.12} bottom={-0.48} />{[-0.18, 0.18].map((x) => <mesh key={x} position={[x, -0.52, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.1, 0.025, 12, 24]} />{material}</mesh>)}</group>
  if (type === 'bar') return <mesh position={position} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.035, 0.62, 16]} />{material}</mesh>
  if (type === 'climbing') return <group position={position}><RoundedBox scale={[0.6, 0.92, 0.08]} radius={0.03}>{material}</RoundedBox>{[-0.18, 0.15].map((x, i) => <mesh key={x} position={[x, i ? 0.2 : -0.2, 0.07]}><sphereGeometry args={[0.07, 12, 8]} /><meshStandardMaterial color={i ? ORANGE : '#466b4f'} /></mesh>)}</group>
  if (type === 'shelf') return <RoundedBox position={position} scale={[0.68, 0.12, 0.34]} radius={0.04}>{material}</RoundedBox>
  return <RoundedBox position={position} scale={[0.62, 0.1, 0.48]} radius={0.1}>{material}</RoundedBox>
}

function AnimatedModule({ type, position }: { type: ModuleType, position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  const target = useMemo(() => new THREE.Vector3(...position), [position])
  const entered = useRef(false)
  useEffect(() => {
    if (!ref.current) return
    ref.current.position.set(position[0] - 0.32, position[1] + 0.42, position[2] + 0.18)
    ref.current.scale.setScalar(0.78)
  }, [position])
  useFrame(() => {
    if (!ref.current || entered.current) return
    ref.current.position.lerp(target, 0.18)
    ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.18)
    if (ref.current.position.distanceTo(target) < 0.008) { ref.current.position.copy(target); ref.current.scale.setScalar(1); entered.current = true }
  })
  return <group ref={ref}><ModuleMesh type={type} position={[0, 0, 0]} /></group>
}

function PulsingAnchor({ anchor, onClick }: { anchor: Anchor, onClick: () => void }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => { if (ref.current) ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 5) * 0.08) })
  return <mesh ref={ref} position={anchor.position} onClick={(event) => { event.stopPropagation(); onClick() }}>
    <sphereGeometry args={[0.09, 20, 16]} /><meshStandardMaterial color="#f5c85a" emissive="#f28a32" emissiveIntensity={0.45} />
  </mesh>
}

function CameraRig({ focus }: { focus?: [number, number, number] }) {
  const { camera } = useThree()
  const target = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    if (!focus) return
    target.set(focus[0] + 2.5, focus[1] + 1.4, focus[2] + 3.2)
    camera.position.lerp(target, 0.06)
    camera.lookAt(focus[0], focus[1], focus[2])
  })
  return null
}

function Product({ skeleton, installed, selectedType, onAnchor, home }: { skeleton: Skeleton, installed: InstalledModule[], selectedType?: ModuleType, onAnchor?: (anchor: Anchor) => void, home?: boolean }) {
  const group = useRef<THREE.Group>(null)
  const [entered, setEntered] = useState(false)
  useEffect(() => { const id = requestAnimationFrame(() => setEntered(true)); return () => cancelAnimationFrame(id) }, [])
  useFrame(() => {
    if (!group.current || entered) return
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.08)
  })
  return <group ref={group} rotation={[0, entered ? 0 : -0.14, 0]} scale={home ? 0.92 : 1}>
    <Frame skeleton={skeleton} />
    {installed.map((item) => {
      const anchor = skeleton.anchors.find((entry) => entry.id === item.anchorId)
      return anchor ? <AnimatedModule key={item.id} type={item.type} position={anchor.position} /> : null
    })}
    {selectedType && skeleton.anchors.filter((anchor) => anchor.type === modules.find((item) => item.type === selectedType)?.anchorType && !installed.some((item) => item.anchorId === anchor.id)).map((anchor) => <PulsingAnchor key={anchor.id} anchor={anchor} onClick={() => onAnchor?.(anchor)} />)}
  </group>
}

export default function ProductScene({ skeleton, installed = [], selectedType, onAnchor, home = false, focus }: { skeleton: Skeleton, installed?: InstalledModule[], selectedType?: ModuleType, onAnchor?: (anchor: Anchor) => void, home?: boolean, focus?: [number, number, number] }) {
  return <Canvas shadows camera={{ position: home ? [3.4, 2.65, 4.4] : [4.1, 3.05, 5.25], fov: 38 }} gl={{ antialias: true, preserveDrawingBuffer: true }} data-testid="product-canvas">
    <color attach="background" args={[home ? '#fff8e8' : '#f7f3e9']} />
    <ambientLight intensity={1.65} />
    <directionalLight position={[3, 5, 4]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
    <pointLight position={[-3, 2, 2]} intensity={0.8} color="#f5c85a" />
    <Product skeleton={skeleton} installed={installed} selectedType={selectedType} onAnchor={onAnchor} home={home} />
    <ContactShadows position={[0, -0.02, 0]} opacity={0.26} scale={6} blur={2.3} far={3} />
    <gridHelper args={[5, 10, '#d8d1c1', '#ede7da']} position={[0, 0, 0]} />
    <OrbitControls makeDefault enablePan={false} minDistance={home ? 3.2 : 3.8} maxDistance={7} minPolarAngle={0.7} maxPolarAngle={1.45} enableDamping dampingFactor={0.07} />
    <CameraRig focus={focus} />
  </Canvas>
}
