import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three"; // Import THREE.js

const HeartShape = ({ position, color, size }) => {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, size / 2);
  heartShape.bezierCurveTo(size, size, size, 0, 0, -size);
  heartShape.bezierCurveTo(-size, 0, -size, size, 0, size / 2);

  const extrudeSettings = { depth: size / 2, bevelEnabled: true, bevelThickness: 0.5 };

  return (
    <mesh ref={meshRef} position={position}>
      <extrudeGeometry args={[heartShape, extrudeSettings]} />
      <meshStandardMaterial color={color} wireframe />
    </mesh>
  );
};

const StarShape = ({ position, color, size }) => {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  const starShape = new THREE.Shape();
  const outerRadius = size;
  const innerRadius = size / 2;
  const spikes = 5;

  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) {
      starShape.moveTo(x, y);
    } else {
      starShape.lineTo(x, y);
    }
  }
  starShape.closePath();

  const extrudeSettings = { depth: size / 4, bevelEnabled: true, bevelThickness: 0.2 };

  return (
    <mesh ref={meshRef} position={position}>
      <extrudeGeometry args={[starShape, extrudeSettings]} />
      <meshStandardMaterial color={color} wireframe />
    </mesh>
  );
};

const FloatingObject = ({ shape, position, color, size }) => {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      {shape === "box" && <boxGeometry args={[size, size, size]} />}
      {shape === "sphere" && <sphereGeometry args={[size, 10, 10]} />}
      {shape === "torus" && <torusGeometry args={[size, size / 3, 16, 50]} />}
      {shape === "cone" && <coneGeometry args={[size, size * 1.5, 32]} />}
      {shape === "cylinder" && <cylinderGeometry args={[size, size, size * 1.5, 32]} />}
      {shape === "dodecahedron" && <dodecahedronGeometry args={[size]} />}
      <meshStandardMaterial color={color} wireframe />
    </mesh>
  );
};

const ThreeShapes = () => {
  return (
    <Canvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: "-1",
      }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 3, 3]} />

      {/* Existing Shapes */}
      <FloatingObject shape="box" position={[-10, 14, -15]} color="red" size={2} />
      <FloatingObject shape="sphere" position={[-20, 10, -10]} color="green" size={1} />
      <FloatingObject shape="sphere" position={[6, -10, -8]} color="orange" size={1} />
      <FloatingObject shape="torus" position={[-17, -8, -10]} color="green" size={1.5} />
      <FloatingObject shape="cone" position={[10, -2, -14]} color="purple" size={2} />
      <FloatingObject shape="cylinder" position={[-10, -5, -18]} color="orange" size={2} />

      {/* New Shape at Top-Right */}
      <FloatingObject shape="dodecahedron" position={[30, 5, -18]} color="pink" size={2} />

      {/* Cute Heart Shape 💖 */}
      <HeartShape position={[15, -8, -10]} color="hotpink" size={1.5} />

      {/* New Cute Star Shape ⭐ (Left-Middle) */}
      <StarShape position={[-15, 6, -12]} color="gold" size={2} />

      <OrbitControls enableZoom={false} />
    </Canvas>
  );
};

export default ThreeShapes;
