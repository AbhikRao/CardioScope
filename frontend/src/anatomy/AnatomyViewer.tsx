import { Component, useEffect, useReducer, useRef, useState } from 'react';
import type { ComponentRef, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { AnatomyManifest } from '../api';
import { api } from '../api';
import { LABELS, NEUTRAL_STATES, VESSELS, vesselColor } from './contract';
import type { Vessel, VesselStates } from './contract';
import { loadAnatomy } from './assets';
import type { AnatomyAssets } from './assets';
import { INITIAL_STATE, viewerReducer, visibleGroups } from './state';
import type { ViewerAction, ViewerState } from './state';

export function webGLAvailable(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}

class RenderBoundary extends Component<{ children: ReactNode; onError: (message: string) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.onError(error.message); }
  render() { return this.state.failed ? null : this.props.children; }
}

interface SceneProps {
  manifest: AnatomyManifest;
  assets: AnatomyAssets;
  state: ViewerState;
  vesselStates: VesselStates;
  onSelect: (vessel: Vessel) => void;
  onReady: () => void;
  onFPS: (fps: number) => void;
  onCamera: (position: string) => void;
}
const HEART_COLOR = '#d9cfc9';
const DISTANCE = 3.25, FOCUS_DISTANCE = 3.0, TRANSITION_MS = 520;
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// Camera transitions orbit around the superior (Z) axis; they move the viewpoint only.
interface Transition { start: number; from: Spherical; to: Spherical; fromTarget: Vector3; toTarget: Vector3 }
interface Spherical { radius: number; azimuth: number; elevation: number }
function spherical(offset: Vector3): Spherical {
  const radius = offset.length();
  return { radius, azimuth: Math.atan2(offset.y, offset.x), elevation: Math.asin(Math.max(-1, Math.min(1, offset.z / radius))) };
}
function fromSpherical({ radius, azimuth, elevation }: Spherical): Vector3 {
  return new Vector3(radius * Math.cos(elevation) * Math.cos(azimuth), radius * Math.cos(elevation) * Math.sin(azimuth), radius * Math.sin(elevation));
}
function Scene({ manifest, assets, state, vesselStates, onSelect, onReady, onFPS, onCamera }: SceneProps) {
  const { camera, invalidate, size } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const frame = useRef({ elapsed: 0, count: 0, ready: false });
  const transition = useRef<Transition | null>(null);
  const report = () => onCamera(camera.position.toArray().map(value => value.toFixed(3)).join(','));
  useFrame((_render, delta) => {
    const counter = frame.current;
    if (!counter.ready) { counter.ready = true; onReady(); }
    counter.elapsed += delta;
    counter.count++;
    if (counter.elapsed >= 1) {
      onFPS(Math.round(counter.count / counter.elapsed));
      counter.elapsed = 0; counter.count = 0;
    }
    const move = transition.current;
    if (move && controls.current) {
      const t = Math.min(1, (performance.now() - move.start) / TRANSITION_MS), e = 1 - (1 - t) ** 3;
      let turn = move.to.azimuth - move.from.azimuth;
      if (turn > Math.PI) turn -= 2 * Math.PI;
      if (turn < -Math.PI) turn += 2 * Math.PI;
      const target = move.fromTarget.clone().lerp(move.toTarget, e);
      camera.position.copy(target.clone().add(fromSpherical({
        radius: move.from.radius + (move.to.radius - move.from.radius) * e,
        azimuth: move.from.azimuth + turn * e,
        elevation: move.from.elevation + (move.to.elevation - move.from.elevation) * e,
      })));
      controls.current.target.copy(target);
      controls.current.update();
      if (t >= 1) { transition.current = null; report(); }
    }
  });
  useEffect(() => {
    if (!controls.current) return;
    const target = state.focus && state.selected
      ? assets.bounds[state.selected].getCenter(new Vector3()) : new Vector3();
    // Preset directions are source axes; Z is superior and negative Y anterior.
    // LCX focus uses the posterior surface observed in the verified source assembly.
    const direction = new Vector3(0, state.view === 'anterior' ? -1 : 1, 0);
    // Narrow canvases need a longer distance so the whole heart width stays in frame.
    const fit = Math.max(1, 1.3 / Math.max(0.1, size.width / Math.max(1, size.height)));
    const destination = target.clone().addScaledVector(direction, (state.focus ? FOCUS_DISTANCE : DISTANCE) * fit);
    camera.up.set(0, 0, 1);
    const first = !frame.current.ready;
    if (first || reducedMotion()) {
      transition.current = null;
      camera.position.copy(destination);
      controls.current.target.copy(target);
      controls.current.update();
      report();
    } else {
      const fromTarget = controls.current.target.clone();
      transition.current = {
        start: performance.now(), fromTarget, toTarget: target,
        from: spherical(camera.position.clone().sub(fromTarget)), to: spherical(destination.clone().sub(target)),
      };
    }
    invalidate();
    // Orbit changes must not cause this command to replay; revisions are explicit.
  }, [state.cameraRevision, assets, camera, invalidate]);
  const center = manifest.assembly.center;
  const scale = manifest.assembly.scale;
  const labelPosition = state.selected ? assets.bounds[state.selected].getCenter(new Vector3()) : null;
  return <>
    <hemisphereLight args={['#ffffff', '#b8c2c8', 1.1]} />
    <ambientLight intensity={0.55} />
    <directionalLight position={[3, -4, 5]} intensity={2.1} />
    <directionalLight position={[-3, 4, 2]} intensity={1.1} />
    <group scale={scale}>
      <group position={[-center[0], -center[1], -center[2]]}>
        {visibleGroups(state).map(group => {
          const selected = state.selected === group;
          // While one vessel is selected the others stay in their probability color, faded.
          const faded = group !== 'heart' && !!state.selected && !selected && !state.isolated;
          return <group key={group} name={group}>
            {assets.groups[group].map(({ leaf, geometry }, index) => <mesh
              key={`${leaf}-${index}`} name={`${group}/${leaf}`} geometry={geometry} dispose={null}
              renderOrder={faded ? 1 : 0}
              onClick={group === 'heart' ? undefined : event => {
                if (event.delta > 4) return; // An orbit drag is not a vessel click.
                event.stopPropagation(); onSelect(group);
              }}>
              <meshStandardMaterial
                key={faded ? 'faded' : 'solid'} // transparency changes need a new material program
                color={group === 'heart' ? HEART_COLOR : vesselColor(vesselStates[group])}
                roughness={group === 'heart' ? 0.82 : 0.45}
                metalness={0}
                // Selection glows in the vessel's own probability color, so the hue is unchanged.
                emissive={selected ? vesselColor(vesselStates[group]) : '#000000'}
                emissiveIntensity={selected ? 0.45 : 0}
                transparent={faded}
                opacity={faded ? 0.22 : 1}
                depthWrite={!faded}
              />
            </mesh>)}
          </group>;
        })}
      </group>
    </group>
    {state.selected && labelPosition && <Html position={labelPosition} center style={{ pointerEvents: 'none' }}>
      <span className="vessel-label">{state.selected}</span>
    </Html>}
    <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping={false} minDistance={1.4} maxDistance={8}
      onStart={() => { transition.current = null; }} onChange={report} />
  </>;
}

export function AnatomyViewer({ vesselStates = NEUTRAL_STATES, viewerState, onAction, active = true }: {
  vesselStates?: VesselStates; viewerState?: ViewerState; onAction?: (action: ViewerAction) => void;
  active?: boolean;
}) {
  const [localState, localDispatch] = useReducer(viewerReducer, INITIAL_STATE);
  const state = viewerState ?? localState, dispatch = onAction ?? localDispatch;
  const [supported] = useState(webGLAvailable);
  const [manifest, setManifest] = useState<AnatomyManifest | null>(null);
  const [assets, setAssets] = useState<AnatomyAssets | null>(null);
  const [progress, setProgress] = useState({ loaded: 0, total: 83 });
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const [fps, setFPS] = useState<number | null>(null);
  const [cameraPosition, setCameraPosition] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!supported) return;
    const controller = new AbortController();
    let prepared: AnatomyAssets | undefined;
    setError(null); setAssets(null); setManifest(null); setRendered(false); setFPS(null);
    setProgress({ loaded: 0, total: 83 });
    async function load() {
      try {
        const result = await api.anatomy(controller.signal);
        controller.signal.throwIfAborted();
        const meshes = await loadAnatomy(result, controller.signal,
          (loaded, total) => { if (!controller.signal.aborted) setProgress({ loaded, total }); });
        prepared = meshes;
        if (controller.signal.aborted) { meshes.dispose(); return; }
        setManifest(result); setAssets(meshes);
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Anatomy request failed');
      }
    }
    void load();
    return () => { controller.abort(); prepared?.dispose(); };
  }, [supported, attempt]);

  const available = supported && !error && rendered;
  const selectedData = state.selected ? vesselStates[state.selected] : null;
  const hasPredictions = VESSELS.some(vessel => vesselStates[vessel].status === 'prediction');
  const select = (vessel: Vessel) => dispatch({ type: 'select', vessel });
  const failure = !supported ? 'WebGL 2 is unavailable. The 3D anatomy could not be rendered.'
    : error ? `3D anatomy unavailable: ${error}. No partial anatomy is displayed.` : null;
  const percent = (vessel: Vessel) => {
    const data = vesselStates[vessel];
    return data.status === 'prediction' ? `${(data.probability * 100).toFixed(1)}%` : null;
  };
  return <section aria-labelledby="anatomy-heading" className="anatomy-viewer">
    <div className="anatomy-header">
      <div><h2 id="anatomy-heading">Coronary anatomy</h2>
        <p className="anatomy-lede">Reference anatomy, not a reconstruction of a patient. {hasPredictions
          ? 'Each whole artery is colored by its own model-estimated probability.'
          : 'Neutral vessel colors: predictions unavailable.'}</p></div>
      <p className="orientation-note">Last preset: <strong>{state.view}</strong> · top is superior</p>
    </div>
    {failure ? <div role="alert"><p>{failure}</p><p>Use the numerical model outputs below when available. This device has not rendered the anatomy.</p>
      {supported && <button onClick={() => setAttempt(value => value + 1)}>Retry anatomy</button>}</div>
      : <div className="anatomy-stage">
        <div className="viewer-toolbar">
          <div className="viewer-controls vessel-controls" role="group" aria-label="Select an artery">
            {VESSELS.map(vessel => <button key={vessel} aria-pressed={state.selected === vessel} aria-label={vessel}
              disabled={!available} onClick={() => select(vessel)}>
              <i aria-hidden="true" className="vessel-swatch" style={{ background: vesselColor(vesselStates[vessel]) }} />
              <span>{vessel}</span>{available && percent(vessel) && <small aria-hidden="true">{percent(vessel)}</small>}
            </button>)}
          </div>
          <div className="viewer-controls view-controls" role="group" aria-label="Anatomy controls">
            <button disabled={!available} onClick={() => dispatch({ type: 'view', view: 'anterior' })}>Anterior view</button>
            <button disabled={!available} onClick={() => dispatch({ type: 'view', view: 'posterior' })}>Posterior view</button>
            <button disabled={!available || !state.selected} aria-pressed={state.isolated}
              onClick={() => dispatch({ type: 'isolate' })}>Isolate selected vessel</button>
            <button disabled={!available} onClick={() => dispatch({ type: 'show-all' })}>Show all</button>
            <button disabled={!available} onClick={() => dispatch({ type: 'reset' })}>Reset view</button>
          </div>
        </div>
        <div className="anatomy-canvas" role="img" aria-label={`Reference heart and coronary anatomy${state.selected ? `; ${state.selected} selected` : ''}. Vessel selection and view presets are available using the buttons above.`}
          data-selected={state.selected ?? ''} data-isolated={state.isolated}
          data-camera={cameraPosition} data-rendered={rendered}>
          {assets && manifest && <RenderBoundary key={attempt} onError={setError}>
            <Canvas frameloop={active ? 'always' : 'never'} camera={{ position: [0, -DISTANCE, 0], up: [0, 0, 1], fov: 40, near: 0.1, far: 30 }}
              dpr={[1, 2]} gl={{ antialias: true, alpha: true }}
              onCreated={({ gl }) => {
                gl.setClearColor('#000000', 0);
                gl.domElement.addEventListener('webglcontextlost', event => {
                  event.preventDefault(); setError('WebGL rendering context was lost. Retry to reload the renderer');
                }, { once: true });
              }}>
              <Scene manifest={manifest} assets={assets} state={state} vesselStates={vesselStates}
                onSelect={select} onReady={() => setRendered(true)} onFPS={setFPS} onCamera={setCameraPosition} />
            </Canvas>
          </RenderBoundary>}
          {!rendered && <div className="canvas-loading" aria-hidden="true"><span />{assets ? 'Starting renderer…' : `Loading ${progress.loaded}/${progress.total} meshes…`}</div>}
          <div className="selection-readout" aria-live="polite">
            <p className="selection-name">{state.selected ? `Selected: ${state.selected} — ${LABELS[state.selected]}` : 'Select LAD, LCX or RCA in the model or controls.'}</p>
            {state.selected && <p className="selection-value">{selectedData?.status === 'prediction'
              ? `Model-estimated stenosis probability: ${(selectedData.probability * 100).toFixed(1)}%`
              : selectedData?.status === 'pending' ? 'Selected vessel prediction: pending.'
              : selectedData?.status === 'error' ? `Selected vessel prediction unavailable: ${selectedData.message}`
              : 'Selected vessel probability: unavailable.'}</p>}
          </div>
          <p className="canvas-hint" aria-hidden="true">Click an artery · drag to rotate · scroll to zoom</p>
        </div>
        <div className="anatomy-status">
          <p role="status">{rendered ? 'Anatomy loaded and renderer ready: 83 verified source meshes.' :
            `Loading anatomy: ${progress.loaded}/${progress.total} meshes verified${assets ? '; starting renderer' : ''}…`}</p>
          <p>{rendered ? state.isolated ? 'Only the selected vessel is shown.' : state.selected
            ? 'Heart and all three vessels are shown; unselected vessels are faded.' : 'Heart and all three vessels are shown.'
            : 'Controls will be enabled after the complete anatomy renders.'}</p>
        </div>
        <details className="anatomy-notes"><summary>About this view</summary>
          <p>{hasPredictions ? 'Vessel colors represent model-estimated probability, not measured stenosis severity. Selection is shown by a highlight, a label and fading of the other vessels; faded vessels keep their own probability colors.' :
            'Neutral gray marks vessels before prediction; the highlight marks the selection. These colors do not indicate risk.'}</p>
          <p>Source orientation: top is superior in the anterior/posterior presets. Dragging changes the viewpoint; preset changes animate the camera only. Drag to rotate; scroll or pinch to zoom.</p>
          {fps !== null && <p className="performance">Approximate render cadence: {fps} FPS. This is a local measurement, not a hardware guarantee.</p>}
          {manifest && <p><small>{manifest.source_records.attribution}. Shared source coordinates preserved.</small></p>}
        </details>
      </div>}
  </section>;
}
