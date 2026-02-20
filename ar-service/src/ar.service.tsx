/**
 * Augmented Reality Features
 * 3D visualization, AR delivery tracking, package contents, room planning
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as THREE from 'three';

export interface ARObject {
  id?: string;
  type:
    | '3D_MODEL'
    | 'MARKER'
    | 'GEOFENCE'
    | 'PACKAGE_PREVIEW'
    | 'NAVIGATION_ARROW';
  modelUrl: string;
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  metadata?: Record<string, any>;
}

export interface ARSession {
  id?: string;
  type:
    | 'DELIVERY_TRACKING'
    | 'PACKAGE_PREVIEW'
    | 'ROOM_PLANNING'
    | 'NAVIGATION';
  userId: string;
  orderId?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
  objects: ARObject[];
  cameraPosition: { x: number; y: number; z: number };
  startedAt: Date;
  endedAt?: Date;
  metrics?: {
    objectsPlaced: number;
    interactionCount: number;
    duration: number;
  };
}

/**
 * AR Delivery Tracker Component
 * Real-time tracking with 3D package visualization
 */
export const ARDeliveryTracker: React.FC<{
  orderId: string;
  driverLocation: { latitude: number; longitude: number };
  userLocation: { latitude: number; longitude: number };
}> = ({ orderId, driverLocation, userLocation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    initializeARScene();
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  const initializeARScene = () => {
    if (!canvasRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0.1);
    rendererRef.current = renderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      metalness: 0.3,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Add 3D package
    const packageGeometry = new THREE.BoxGeometry(1, 1.5, 0.8);
    const packageMaterial = new THREE.MeshStandardMaterial({
      color: 0xff9800,
      metalness: 0.1,
      roughness: 0.5,
    });
    const packageMesh = new THREE.Mesh(packageGeometry, packageMaterial);
    packageMesh.position.set(0, 1, 0);
    packageMesh.castShadow = true;
    packageMesh.receiveShadow = true;
    scene.add(packageMesh);

    // Add delivery vehicle (simplified truck)
    const vehicleGroup = new THREE.Group();

    // Truck body
    const truckBodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const truckMaterial = new THREE.MeshStandardMaterial({ color: 0x1a237e });
    const truckBody = new THREE.Mesh(truckBodyGeometry, truckMaterial);
    truckBody.position.y = 0.5;
    vehicleGroup.add(truckBody);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const wheels = [
      { x: -0.7, z: -1 },
      { x: 0.7, z: -1 },
      { x: -0.7, z: 1 },
      { x: 0.7, z: 1 },
    ];

    wheels.forEach(({ x, z }) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.4, z);
      vehicleGroup.add(wheel);
    });

    vehicleGroup.position.set(0, 0, -5);
    scene.add(vehicleGroup);

    // Add navigation arrow
    const arrowGroup = new THREE.Group();
    const arrowGeometry = new THREE.ConeGeometry(0.5, 2, 8);
    const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.position.y = 1;
    arrowGroup.add(arrow);
    arrowGroup.position.set(0, 0, -3);
    scene.add(arrowGroup);

    // Add distance marker
    const markerGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: 0xffeb3b,
      emissive: 0xffeb3b,
      emissiveIntensity: 0.5,
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(0, 0.5, 2);
    scene.add(marker);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate package
      packageMesh.rotation.y += 0.005;

      // Animate truck movement
      vehicleGroup.position.z += 0.02;
      if (vehicleGroup.position.z > 5) {
        vehicleGroup.position.z = -5;
      }

      // Pulse marker
      const scale = 0.3 + Math.sin(Date.now() * 0.005) * 0.1;
      marker.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />

      {/* AR Info Overlay */}
      <div style={styles.infoPanel}>
        <div style={styles.header}>
          <h2>🚗 Live AR Delivery Tracking</h2>
        </div>

        <div style={styles.content}>
          <div style={styles.infoRow}>
            <span>Order ID:</span>
            <strong>{orderId}</strong>
          </div>

          <div style={styles.infoRow}>
            <span>Distance:</span>
            <strong style={{ color: '#4caf50' }}>2.5 km</strong>
          </div>

          <div style={styles.infoRow}>
            <span>ETA:</span>
            <strong>15 minutes</strong>
          </div>

          <div style={styles.infoRow}>
            <span>Driver:</span>
            <strong>John Doe ⭐ 4.8</strong>
          </div>

          <div style={styles.infoRow}>
            <span>Vehicle:</span>
            <strong>Honda Odyssey • License: ABC123</strong>
          </div>
        </div>

        <div style={styles.controls}>
          <button style={styles.button}>📞 Call Driver</button>
          <button style={styles.button}>📍 Navigate</button>
          <button style={styles.button}>💬 Message</button>
        </div>
      </div>

      {/* AR Markers */}
      <div style={styles.marker}>
        <div style={styles.markerContent}>📦 Package Location</div>
      </div>
    </div>
  );
};

/**
 * AR Package Preview Component
 * View package contents in 3D
 */
export const ARPackagePreview: React.FC<{
  items: Array<{ name: string; quantity: number; image: string }>;
}> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<number>(0);

  return (
    <View style={styles.container}>
      <View style={styles.previewArea}>
        <Text style={styles.title}>📦 Package Contents (AR View)</Text>

        {/* 3D Item Display */}
        <View style={styles.itemDisplay}>
          <Text style={styles.itemName}>{items[selectedItem].name}</Text>
          <Text style={styles.itemQuantity}>
            Qty: {items[selectedItem].quantity}
          </Text>
          <View
            style={{
              width: 200,
              height: 200,
              backgroundColor: '#e8f5e9',
              borderRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 80 }}>📦</Text>
          </View>
        </View>

        {/* Item Selector */}
        <View style={styles.itemSelector}>
          {items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemCard,
                selectedItem === index && styles.itemCardSelected,
              ]}
            >
              <Text
                onPress={() => setSelectedItem(index)}
                style={styles.itemCardText}
              >
                {item.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Package Info */}
        <View style={styles.packageInfo}>
          <Text style={styles.infoText}>Total Items: {items.length}</Text>
          <Text style={styles.infoText}>
            Total Weight: {items.length * 2} kg
          </Text>
          <Text style={styles.infoText}>Fragile: Yes</Text>
          <Text style={styles.infoText}>Handle With Care ⚠️</Text>
        </View>
      </View>
    </View>
  );
};

/**
 * AR Room Planning Component
 * Visualize delivery in customer's space
 */
export const ARRoomPlanner: React.FC<{}> = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🏠 AR Room Planner</Text>

        <View style={styles.roomCanvas}>
          <Text style={{ fontSize: 100, textAlign: 'center' }}>📐</Text>
          <Text style={styles.roomText}>
            Point your camera at the floor to scan your room
          </Text>
        </View>

        <View style={styles.placements}>
          <Text style={styles.placementTitle}>Suggested Placements:</Text>

          <View style={styles.placementItem}>
            <Text style={styles.placementIcon}>🪑</Text>
            <View style={styles.placementDetails}>
              <Text style={styles.placementName}>Living Room</Text>
              <Text style={styles.placementDesc}>Center wall • 2.5m width</Text>
            </View>
            <Text style={styles.placementMatch}>85% Match</Text>
          </View>

          <View style={styles.placementItem}>
            <Text style={styles.placementIcon}>🛏️</Text>
            <View style={styles.placementDetails}>
              <Text style={styles.placementName}>Bedroom</Text>
              <Text style={styles.placementDesc}>
                Opposite wall • 2.0m width
              </Text>
            </View>
            <Text style={styles.placementMatch}>72% Match</Text>
          </View>

          <View style={styles.placementItem}>
            <Text style={styles.placementIcon}>🍽️</Text>
            <View style={styles.placementDetails}>
              <Text style={styles.placementName}>Dining Area</Text>
              <Text style={styles.placementDesc}>
                Corner placement • 1.8m width
              </Text>
            </View>
            <Text style={styles.placementMatch}>65% Match</Text>
          </View>
        </View>

        <View style={styles.dimensions}>
          <Text style={styles.dimensionLabel}>Room Dimensions:</Text>
          <View style={styles.dimensionInput}>
            <Text>Width: 4.5m</Text>
            <Text>Depth: 3.8m</Text>
            <Text>Height: 2.7m</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

/**
 * AR Navigation Component
 * Step-by-step directions with AR overlays
 */
export const ARNavigation: React.FC<{
  destination: string;
}> = ({ destination }) => {
  return (
    <View style={styles.container}>
      <View style={styles.navigationOverlay}>
        <View style={styles.nextTurn}>
          <Text style={styles.turnIcon}>↗️</Text>
          <View style={styles.turnDetails}>
            <Text style={styles.turnName}>Turn Right</Text>
            <Text style={styles.turnDistance}>in 200 meters</Text>
          </View>
        </View>

        <View style={styles.distanceBar}>
          <View style={styles.distanceProgress} />
          <Text style={styles.distanceText}>250m / 2.5km</Text>
        </View>

        <View style={styles.routeInfo}>
          <Text style={styles.routeLabel}>📍 Destination</Text>
          <Text style={styles.routeValue}>{destination}</Text>
          <Text style={styles.etaText}>⏱️ ETA: 12 minutes</Text>
        </View>

        <View style={styles.navigationButtons}>
          <View style={styles.navButton}>
            <Text>🔊</Text>
            <Text>Voice On</Text>
          </View>
          <View style={styles.navButton}>
            <Text>🗺️</Text>
            <Text>Map</Text>
          </View>
          <View style={styles.navButton}>
            <Text>⭐</Text>
            <Text>Save</Text>
          </View>
        </View>
      </View>

      {/* Road visualization */}
      <View style={styles.roadView}>
        <View style={styles.road}>
          <View style={styles.roadLine} />
          <View style={styles.roadLine} />
        </View>
        <Text style={styles.carIcon}>🚗</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a202c',
  },
  // AR Info Panel
  infoPanel: {
    position: 'absolute' as any,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 16,
    color: 'white',
  },
  header: {
    marginBottom: 12,
  },
  infoRow: {
    display: 'flex' as any,
    justifyContent: 'space-between' as any,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    fontSize: 14,
  },
  controls: {
    display: 'flex' as any,
    flexDirection: 'row' as any,
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: '600',
  },
  marker: {
    position: 'absolute' as any,
    top: '30%',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  markerContent: {
    backgroundColor: '#ff9800',
    color: 'white',
    padding: '8px 16px',
    borderRadius: 8,
    fontWeight: '600',
  },
  // Package Preview
  previewArea: {
    alignItems: 'center',
  },
  itemDisplay: {
    alignItems: 'center',
    marginVertical: 20,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
  },
  itemSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
    flexWrap: 'wrap',
  },
  itemCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  itemCardSelected: {
    backgroundColor: '#4299e1',
  },
  itemCardText: {
    color: '#1a202c',
    fontWeight: '500',
  },
  packageInfo: {
    width: '100%',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    marginBottom: 4,
    color: '#1b5e20',
  },
  // Room Planner
  roomCanvas: {
    height: 300,
    backgroundColor: '#eceff1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  roomText: {
    color: '#546e7a',
    marginTop: 16,
  },
  placements: {
    marginBottom: 20,
  },
  placementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  placementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  placementIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  placementDetails: {
    flex: 1,
  },
  placementName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  placementDesc: {
    fontSize: 12,
    color: '#718096',
  },
  placementMatch: {
    color: '#4caf50',
    fontWeight: '600',
  },
  dimensions: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  dimensionLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  dimensionInput: {
    gap: 4,
  },
  // Navigation
  navigationOverlay: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
  },
  nextTurn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  turnIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  turnDetails: {
    flex: 1,
  },
  turnName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  turnDistance: {
    color: '#bbb',
    marginTop: 2,
  },
  distanceBar: {
    marginBottom: 12,
  },
  distanceProgress: {
    height: 8,
    backgroundColor: '#4caf50',
    borderRadius: 4,
    marginBottom: 4,
    width: '30%',
  },
  distanceText: {
    color: '#fff',
    fontSize: 12,
  },
  routeInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  routeLabel: {
    color: '#bbb',
    fontSize: 12,
    marginBottom: 4,
  },
  routeValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  etaText: {
    color: '#4caf50',
    fontSize: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  roadView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  road: {
    width: 300,
    height: 200,
    backgroundColor: '#333',
    borderRadius: 8,
    position: 'relative' as any,
  },
  roadLine: {
    height: 3,
    backgroundColor: '#ffeb3b',
    marginTop: 98,
    marginLeft: '10%',
    width: '80%',
  },
  carIcon: {
    position: 'absolute' as any,
    fontSize: 40,
    bottom: 20,
    left: '45%',
  },
});

export default {
  ARDeliveryTracker,
  ARPackagePreview,
  ARRoomPlanner,
  ARNavigation,
};
