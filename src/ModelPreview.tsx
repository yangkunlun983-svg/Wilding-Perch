import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { InstalledModuleKey, ModuleKey, PlankVariant, SkeletonKey } from './appTypes'

const modelBase = '/design-assets/models'

type ModelTransform = {
  center: THREE.Vector3
  scale: number
}

const plankAnchorPositions: Record<PlankVariant, [number, number, number]> = {
  small: [-1.35, -0.1, 0.9],
  medium: [-0.05, 0.78, 0.9],
  large: [1.25, -0.1, 0.9],
}

const moduleAnchorPositions: Record<Exclude<ModuleKey, 'plank'>, [number, number, number]> = {
  lever: [-0.42, 0.18, 0.48],
  rings: [0.08, 0.34, 0.48],
  swing: [0.38, 0.22, 0.48],
  'climbing wall': [-0.32, -0.08, 0.48],
  shelf: [0.36, -0.02, 0.48],
}

function getModelUrl(skeleton: SkeletonKey, module?: InstalledModuleKey) {
  if (!module) return `${modelBase}/configurable/${skeleton}_base.glb`
  if (skeleton === 'standard') return `${modelBase}/configurable/standard_swing.glb`
  if (module === 'climbing wall') return `${modelBase}/configurable/luxury_climbing_wall.glb`
  return `${modelBase}/configurable/luxury_${module}.glb`
}

function getModelTransform(object: THREE.Object3D, targetSize: number): ModelTransform {
  const box = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  const largestSide = Math.max(size.x, size.y, size.z)
  return {
    center,
    scale: Number.isFinite(largestSide) && largestSide > 0 ? targetSize / largestSide : 1,
  }
}

function sanitizeGeometry(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute('position')
  if (position) {
    const array = position.array
    for (let i = 0; i < array.length; i += 1) {
      if (!Number.isFinite(array[i])) array[i] = 0
    }
    position.needsUpdate = true
  }
  const normal = geometry.getAttribute('normal')
  if (normal) {
    const array = normal.array
    for (let i = 0; i < array.length; i += 1) {
      if (!Number.isFinite(array[i])) array[i] = 0
    }
    normal.needsUpdate = true
  }
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
}

function prepareModel(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      sanitizeGeometry(child.geometry)
      child.castShadow = true
      child.receiveShadow = true
      child.material = new THREE.MeshStandardMaterial({
        color: '#f7f4e8',
        metalness: 0.22,
        roughness: 0.34,
        side: THREE.DoubleSide,
      })
    }
    if (child instanceof THREE.Line) {
      sanitizeGeometry(child.geometry)
      child.material = new THREE.LineBasicMaterial({ color: '#f7f4e8' })
    }
    if (child instanceof THREE.Points) {
      sanitizeGeometry(child.geometry)
      child.material = new THREE.PointsMaterial({ color: '#f7f4e8', size: 0.025, sizeAttenuation: true })
    }
  })
}

function ModelPart({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url)
  const object = useMemo(() => {
    const clone = gltf.scene.clone(true)
    prepareModel(clone)
    return clone
  }, [gltf.scene])
  return <primitive object={object} />
}

function ConfiguredModel({ skeleton, modules, onReady }: { skeleton: SkeletonKey, modules: InstalledModuleKey[], onReady: () => void }) {
  const baseUrl = getModelUrl(skeleton)
  const base = useLoader(GLTFLoader, baseUrl)
  const transform = useMemo(() => getModelTransform(base.scene, skeleton === 'standard' ? 2.95 : 2.8), [base.scene, skeleton])
  const moduleUrls = useMemo(() => Array.from(new Set(modules)).map((module) => getModelUrl(skeleton, module)), [modules, skeleton])
  useEffect(() => onReady(), [onReady, base.scene])
  return <group position={[-transform.center.x * transform.scale, -transform.center.y * transform.scale, -transform.center.z * transform.scale]} scale={transform.scale}>
    <ModelPart url={baseUrl} />
    {moduleUrls.map((url) => <ModelPart key={url} url={url} />)}
  </group>
}

function AnchorDots({ selected, forcedPlankVariant, onInstall }: { selected?: ModuleKey, forcedPlankVariant?: PlankVariant, onInstall?: (key: ModuleKey, variant?: PlankVariant) => void }) {
  if (!selected) return null
  if (selected === 'plank') {
    if (forcedPlankVariant) {
      const position = plankAnchorPositions[forcedPlankVariant]
      return <group>
        <mesh position={position} onClick={(event) => { event.stopPropagation(); onInstall?.('plank', forcedPlankVariant) }}>
          <sphereGeometry args={[0.085, 24, 16]} />
          <meshStandardMaterial color="#fff062" emissive="#ff8621" emissiveIntensity={0.78} />
        </mesh>
      </group>
    }
    return <group>
      {(Object.keys(plankAnchorPositions) as PlankVariant[]).map((variant) => {
        const position = plankAnchorPositions[variant]
        return <group key={variant}>
          <mesh position={position} onClick={(event) => { event.stopPropagation(); onInstall?.('plank', variant) }}>
            <sphereGeometry args={[0.075, 24, 16]} />
            <meshStandardMaterial color="#fff062" emissive="#ff8621" emissiveIntensity={0.75} />
          </mesh>
        </group>
      })}
    </group>
  }
  const position = moduleAnchorPositions[selected as Exclude<ModuleKey, 'plank'>]
  return <group>
    <mesh position={position} onClick={(event) => { event.stopPropagation(); onInstall?.(selected) }}>
      <sphereGeometry args={[0.08, 24, 16]} />
      <meshStandardMaterial color="#fff062" emissive="#ff8621" emissiveIntensity={0.75} />
    </mesh>
    <Html position={[position[0], position[1] + 0.15, position[2]]} center>
      <button className="anchor-label" onClick={() => onInstall?.(selected)}>place</button>
    </Html>
  </group>
}

function Scene({ skeleton, modules, selectedModule, forcedPlankVariant, onInstall, final = false }: { skeleton: SkeletonKey, modules: InstalledModuleKey[], selectedModule?: ModuleKey, forcedPlankVariant?: PlankVariant, onInstall?: (key: ModuleKey, variant?: PlankVariant) => void, final?: boolean }) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (group.current && final) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.45) * 0.08
  })
  return <group ref={group}>
    <group position={[0, -0.12, 0]} rotation={[0, -0.35, 0]} scale={0.88}>
      <Suspense fallback={null}>
        <ConfiguredModel skeleton={skeleton} modules={modules} onReady={() => undefined} />
      </Suspense>
      <AnchorDots selected={selectedModule} forcedPlankVariant={forcedPlankVariant} onInstall={onInstall} />
    </group>
  </group>
}

export default function ModelPreview(props: { skeleton: SkeletonKey, modules?: InstalledModuleKey[], selectedModule?: ModuleKey, forcedPlankVariant?: PlankVariant, onInstall?: (key: ModuleKey, variant?: PlankVariant) => void, final?: boolean }) {
  return <>
    <Canvas className="model-canvas" shadows camera={{ position: [3.7, 2.55, 4.9], fov: 38 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <color attach="background" args={['#fce7aa']} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 5, 3]} intensity={2.4} castShadow />
      <pointLight position={[-3, 2, 2]} intensity={1.2} color="#fff062" />
      <Scene skeleton={props.skeleton} modules={props.modules || []} selectedModule={props.selectedModule} forcedPlankVariant={props.forcedPlankVariant} onInstall={props.onInstall} final={props.final} />
      <ContactShadows position={[0, -1.25, 0]} opacity={0.28} scale={4} blur={2.2} />
      <OrbitControls enablePan={false} minDistance={3.6} maxDistance={6.8} minPolarAngle={0.65} maxPolarAngle={1.45} enableDamping dampingFactor={0.08} />
    </Canvas>
    {props.selectedModule === 'plank' && <div className="plank-anchor-overlay">
      {props.forcedPlankVariant
        ? <button className={`anchor-label plank-${props.forcedPlankVariant} plank-place-only`} onClick={() => props.onInstall?.('plank', props.forcedPlankVariant)}>place</button>
        : (['small', 'medium', 'large'] as PlankVariant[]).map((variant) => <button key={variant} className={`anchor-label plank-${variant}`} onClick={() => props.onInstall?.('plank', variant)}>{variant}</button>)}
    </div>}
  </>
}
