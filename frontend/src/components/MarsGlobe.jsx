import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line } from "@react-three/drei";

const PLANET_RADIUS = 1;

export const latLonToVec3 = (lat, lon, r = PLANET_RADIUS) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
};

const vec3ToLatLon = (p) => {
  const r = p.length();
  const lat = 90 - (Math.acos(THREE.MathUtils.clamp(p.y / r, -1, 1)) * 180) / Math.PI;
  let lon = (Math.atan2(p.z, -p.x) * 180) / Math.PI - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return { lat: +lat.toFixed(2), lon: +lon.toFixed(2) };
};

const marsVertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vWNormal;
  varying vec3 vWPos;
  void main() {
    vPos = position;
    vWNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const marsFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSunDir;
  varying vec3 vPos;
  varying vec3 vWNormal;
  varying vec3 vWPos;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 n = normalize(vPos);
    float continents = fbm(n * 3.0 + vec3(11.3));
    float detail = fbm(n * 12.0 + vec3(4.7));
    float micro = noise(n * 48.0);

    vec3 low = vec3(0.40, 0.19, 0.10);
    vec3 high = vec3(0.67, 0.33, 0.16);
    vec3 dust = vec3(0.86, 0.56, 0.37);
    vec3 basalt = vec3(0.19, 0.10, 0.07);

    vec3 col = mix(low, high, smoothstep(0.35, 0.75, continents));
    col = mix(col, dust, smoothstep(0.55, 0.85, detail) * 0.55);
    col = mix(col, basalt, smoothstep(0.60, 0.72, fbm(n * 2.0 + vec3(31.0))) * 0.65);
    col += (micro - 0.5) * 0.05;

    float cap = smoothstep(0.88, 0.96, abs(n.y) + detail * 0.05);
    col = mix(col, vec3(0.93, 0.92, 0.90), cap);

    vec3 N = normalize(vWNormal);
    vec3 V = normalize(cameraPosition - vWPos);
    vec3 S = normalize(uSunDir);
    float d = dot(N, S);
    float day = smoothstep(-0.18, 0.4, d);
    float diffuse = max(d, 0.0);

    vec3 lit = col * (0.05 + 1.1 * pow(diffuse, 0.85));
    vec3 night = col * 0.05 + vec3(0.008, 0.010, 0.018);
    vec3 final = mix(night, lit, day);

    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.6);
    final += fres * vec3(0.92, 0.45, 0.24) * (0.2 + 0.8 * day) * 0.85;

    gl_FragColor = vec4(final, 1.0);
  }
`;

const atmoVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmoFragment = /* glsl */ `
  uniform vec3 uSunDir;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.5);
    gl_FragColor = vec4(0.95, 0.42, 0.2, 1.0) * intensity;
  }
`;

const MarsPlanet = ({ origin, target, onSelect, onHover }) => {
  const meshRef = useRef();
  const markerRef = useRef();
  const matRef = useRef();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(1, 0.25, 0.4).normalize() },
    }),
    []
  );
  const atmoUniforms = useMemo(() => ({}), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
      const a = t * 0.04;
      matRef.current.uniforms.uSunDir.value
        .set(Math.cos(a), 0.28, Math.sin(a))
        .normalize();
    }
    if (markerRef.current) {
      const s = 1 + Math.sin(t * 4) * 0.25;
      markerRef.current.scale.setScalar(s);
    }
  });

  const routePoints = useMemo(() => {
    if (!origin || !target) return null;
    const a = latLonToVec3(origin.lat, origin.lon, 1.002);
    const b = latLonToVec3(target.lat, target.lon, 1.002);
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      const v = new THREE.Vector3().lerpVectors(a, b, t).normalize();
      v.multiplyScalar(1.002 + Math.sin(t * Math.PI) * 0.14);
      pts.push(v);
    }
    return pts;
  }, [origin, target]);

  const handleClick = (e) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    const local = meshRef.current.worldToLocal(e.point.clone());
    const { lat, lon } = vec3ToLatLon(local);
    onSelect(lat, lon);
  };

  const handleHover = (e) => {
    const local = meshRef.current.worldToLocal(e.point.clone());
    const { lat, lon } = vec3ToLatLon(local);
    onHover(lat, lon);
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerMove={handleHover}
      >
        <sphereGeometry args={[PLANET_RADIUS, 96, 96]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={marsVertex}
          fragmentShader={marsFragment}
          uniforms={uniforms}
        />
      </mesh>

      <mesh scale={1.09}>
        <sphereGeometry args={[PLANET_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={atmoVertex}
          fragmentShader={atmoFragment}
          uniforms={atmoUniforms}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>

      {origin && (
        <group
          position={latLonToVec3(origin.lat, origin.lon, 1.005)}
          quaternion={new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            latLonToVec3(origin.lat, origin.lon, 1).normalize()
          )}
        >
          <mesh ref={markerRef}>
            <ringGeometry args={[0.018, 0.03, 32]} />
            <meshBasicMaterial color="#F59E0B" side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.011, 16, 16]} />
            <meshBasicMaterial color="#F59E0B" />
          </mesh>
        </group>
      )}

      {target && (
        <mesh position={latLonToVec3(target.lat, target.lon, 1.012)}>
          <octahedronGeometry args={[0.022, 0]} />
          <meshBasicMaterial color="#06B6D4" />
        </mesh>
      )}

      {routePoints && (
        <Line
          points={routePoints}
          color="#F59E0B"
          lineWidth={2}
          dashed
          dashSize={0.045}
          gapSize={0.03}
          transparent
          opacity={0.95}
        />
      )}
    </group>
  );
};

const MarsGlobe = ({ origin, target, onSelect, onHover }) => {
  const [interacting, setInteracting] = useState(false);
  const idleTimer = useRef(null);

  const handleStart = () => {
    setInteracting(true);
    clearTimeout(idleTimer.current);
  };
  const handleEnd = () => {
    idleTimer.current = setTimeout(() => setInteracting(false), 3500);
  };

  return (
    <Canvas
      camera={{ position: [0, 0.35, 2.75], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Stars radius={90} depth={50} count={3500} factor={3.2} saturation={0} fade speed={0.4} />
      <MarsPlanet origin={origin} target={target} onSelect={onSelect} onHover={onHover} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={1.7}
        maxDistance={5}
        enableDamping
        dampingFactor={0.08}
        autoRotate={!interacting}
        autoRotateSpeed={0.55}
        onStart={handleStart}
        onEnd={handleEnd}
      />
    </Canvas>
  );
};

export default MarsGlobe;
