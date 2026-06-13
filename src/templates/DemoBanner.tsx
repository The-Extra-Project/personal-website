'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Building2,
  Cloud,
  MapPinned,
  MessageCircle,
  Rocket,
  Send,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { Button } from '@/components/ui/button';

const supporters = [
  { name: 'BPIFrance', Icon: Building2 },
  { name: 'Agoranov', Icon: Rocket },
  { name: 'AWS', Icon: Cloud },
  { name: 'Region Ile de France', Icon: MapPinned },
];

const EARTH_RADIUS = 8;
const PARIS = { lat: 48.8566, lon: 2.3522 };

function latLonToVector3(lat: number, lon: number, radius: number) {
  const latRad = THREE.MathUtils.degToRad(lat);
  const lonRad = THREE.MathUtils.degToRad(lon);

  return new THREE.Vector3(
    radius * Math.cos(latRad) * Math.sin(lonRad),
    radius * Math.sin(latRad),
    radius * Math.cos(latRad) * Math.cos(lonRad),
  );
}

function useGlobeTexture() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#0b1120');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.12)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
    ctx.beginPath();
    ctx.ellipse(565, 170, 110, 60, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(600, 245, 70, 105, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(300, 220, 120, 80, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(518, 117, 5, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    setTexture(tex);

    return () => tex.dispose();
  }, []);

  return texture;
}

function useOSMTexture() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let mounted = true;
    const tileSize = 256;
    const grid = 3;
    const canvas = document.createElement('canvas');
    canvas.width = tileSize * grid;
    canvas.height = tileSize * grid;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    let loaded = 0;
    const total = grid * grid;

    for (let row = 0; row < grid; row++) {
      for (let col = 0; col < grid; col++) {
        const tx = 8284 + col;
        const ty = 5640 + row;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (!mounted) {
            return;
          }

          ctx.drawImage(img, col * tileSize, row * tileSize, tileSize, tileSize);
          loaded += 1;

          if (loaded === total) {
            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
            setTexture(tex);
          }
        };
        img.onerror = () => {
          loaded += 1;
        };
        img.src = `https://tile.openstreetmap.org/14/${tx}/${ty}.png`;
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  return texture;
}

function Globe() {
  const globeTexture = useGlobeTexture();

  return (
    <group>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 80, 80]} />
        <meshStandardMaterial
          map={globeTexture ?? undefined}
          color={globeTexture ? '#ffffff' : '#0f172a'}
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      <mesh scale={1.01}>
        <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
        <meshBasicMaterial
          color="#7dd3fc"
          transparent
          opacity={0.08}
          wireframe
        />
      </mesh>

      <mesh scale={1.04}>
        <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.05} />
      </mesh>
    </group>
  );
}

function ParisUrbanMesh() {
  const osmTexture = useOSMTexture();

  const meshGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(3.4, 3.4, 180, 180);
    geometry.rotateX(-Math.PI / 2);

    const position = geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);

      const montmartre = 0.22 * Math.exp(-((x + 0.55) ** 2 + (z - 0.78) ** 2) / 0.16);
      const defense = 0.18 * Math.exp(-((x - 1.05) ** 2 + (z + 0.1) ** 2) / 0.18);
      const eiffel = 0.55 * Math.exp(-((x + 0.62) ** 2 + (z + 0.12) ** 2) / 0.012);
      const notreDame = 0.18 * Math.exp(-((x - 0.08) ** 2 + (z + 0.08) ** 2) / 0.02);
      const louvre = 0.11 * Math.exp(-((x + 0.12) ** 2 + (z - 0.18) ** 2) / 0.03);
      const seine
        = -0.08
          * Math.exp(-((z + 0.18 * Math.sin(x * 2.4) + 0.1 * Math.cos(x * 4.1)) ** 2) / 0.018);

      const blockNoise
        = 0.04 * Math.sin(x * 16) * Math.cos(z * 14)
          + 0.025 * Math.sin((x + z) * 22)
          + 0.015 * Math.cos((x - z) * 28);

      position.setY(
        i,
        0.03 + montmartre + defense + eiffel + notreDame + louvre + seine + blockNoise,
      );
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  const normal = useMemo(
    () => latLonToVector3(PARIS.lat, PARIS.lon, 1).normalize(),
    [],
  );

  const meshPosition = useMemo(
    () => latLonToVector3(PARIS.lat, PARIS.lon, EARTH_RADIUS + 0.08).toArray() as [number, number, number],
    [],
  );

  const markerPosition = useMemo(
    () => latLonToVector3(PARIS.lat, PARIS.lon, EARTH_RADIUS + 0.28).toArray() as [number, number, number],
    [],
  );

  const meshQuaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal),
    [normal],
  );

  return (
    <>
      <mesh position={markerPosition}>
        <sphereGeometry args={[0.08, 20, 20]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      <group position={meshPosition} quaternion={meshQuaternion}>
        <mesh geometry={meshGeometry} castShadow receiveShadow>
          <meshStandardMaterial
            map={osmTexture ?? undefined}
            color={osmTexture ? '#ffffff' : '#94a3b8'}
            roughness={0.96}
            metalness={0.03}
          />
        </mesh>

        <mesh geometry={meshGeometry} position={[0, 0.018, 0]}>
          <meshBasicMaterial
            color="#93c5fd"
            transparent
            opacity={0.08}
            wireframe
          />
        </mesh>
      </group>
    </>
  );
}

function GlobeScene() {
  const sceneRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (sceneRef.current) {
      sceneRef.current.rotation.y += 0.0015;
    }
  });

  return (
    <group ref={sceneRef}>
      <Globe />
      <ParisUrbanMesh />
    </group>
  );
}

export const DemoBanner = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content:
        'Bonjour! 👋 This is a Paris urban mesh placed on a globe and textured with OpenStreetMap tiles. How can I help you?',
    },
  ]);

  const handleSendMessage = (message: string) => {
    const newUserMessage = { id: Date.now().toString(), role: 'user', content: message };
    setMessages(prev => [...prev, newUserMessage]);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'The scene now uses a globe-first architecture: Earth base layer, Paris geospatial mesh overlay, and OpenStreetMap texture stitched over the city surface.',
        },
      ]);
    }, 800);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-slate-950 to-indigo-950">
      <div className="absolute inset-0 size-full">
        <Canvas camera={{ position: [0, 7, 18], fov: 42 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[12, 10, 8]} intensity={1.2} />
          <pointLight position={[-10, -4, 10]} intensity={0.5} color="#60a5fa" />
          <GlobeScene />
          <OrbitControls enablePan={false} enableZoom enableRotate minDistance={10} maxDistance={28} />
        </Canvas>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-20">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <h1 className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-5xl font-bold text-transparent drop-shadow-lg md:text-7xl">
            Paris Mesh on Globe
          </h1>

          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-blue-100 md:text-2xl">
            A geospatial
            {' '}
            <strong>Paris urban mesh</strong>
            {' '}
            rendered on a rotating globe and
            superimposed with
            {' '}
            <strong>OpenStreetMap</strong>
            {' '}
            tiles.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
              <p className="text-sm text-blue-200">
                <strong>Architecture:</strong>
                {' '}
                Globe + city overlay
              </p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
              <p className="text-sm text-blue-200">
                <strong>Map:</strong>
                {' '}
                OpenStreetMap Paris tiles
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-200/80">
              Supported by
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {supporters.map(({ name, Icon }) => (
                <div
                  key={name}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm"
                >
                  <Icon className="size-4 text-blue-200" />
                  <span className="text-sm font-medium text-white">{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              className="group gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6 text-lg font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-indigo-700 hover:shadow-2xl"
              onClick={() => setIsChatOpen(!isChatOpen)}
            >
              <MessageCircle className="size-6 transition-transform group-hover:rotate-12" />
              Chat with Agent
              <Send className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>

      {isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-96 flex-col rounded-3xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur-xl">
          <div className="rounded-t-3xl border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600">
                <MessageCircle className="size-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Paris Mesh Agent</h3>
                <p className="text-sm text-gray-500">Ask about the urban mesh or OSM data</p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto size-8 p-0" onClick={() => setIsChatOpen(false)}>×</Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {messages.map(message => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.target as HTMLFormElement).querySelector('input') as HTMLInputElement;
                if (input.value.trim()) {
                  handleSendMessage(input.value);
                  input.value = '';
                }
              }}
              className="flex gap-2"
            >
              <input type="text" placeholder="Ask about the Paris mesh..." className="flex-1 rounded-xl border border-gray-200 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <Button type="submit" size="icon" className="rounded-xl"><Send className="size-4" /></Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
