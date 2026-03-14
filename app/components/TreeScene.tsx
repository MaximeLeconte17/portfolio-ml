"use client";

import { JSX, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type LeavesUniforms = {
  [K in
    | "uTime"
    | "uColorA"
    | "uColorB"
    | "uColorC"
    | "uNoiseMap"
    | "uRaycast"

  ]: { value: unknown };
};

type TreeAssets = {
  group: THREE.Group;
  pole?: THREE.Mesh;
  crown?: THREE.Mesh;
  leafGeometry?: THREE.BufferGeometry;
  leaves?: THREE.InstancedMesh;
  leavesCount?: number;
  deadIDs?: number[];
};

type TreeSceneProps = { width?: number; height?: number };


export default function TreeScene({ width, height }: TreeSceneProps) {
    
  const mountRef = useRef<HTMLDivElement | null>(null);

    const [text, setText] = useState("");
    const fullText = "Maxime Leconte - Developpeur Frontend";

  useEffect(() => {

    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) clearInterval(interval);
    }, 50);

    const container = mountRef.current;
    if (!container) return;

    // Renderer / scene / camera
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    container.appendChild(renderer.domElement);
    

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.001, 1000);
    camera.position.set(-7, 1, -12);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.touches = { TWO: THREE.TOUCH.ROTATE };
    controls.enableZoom = false;
    // Lights
    const dlight = new THREE.DirectionalLight(0xffffff, 1.8);
    dlight.position.set(3, 6, -3);
    dlight.lookAt(new THREE.Vector3(0, 2.4, 0));
    scene.add(dlight);

    // Raycasting helpers
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // Dummy objects for instancing math
    const dummy = new THREE.Object3D();
    const matrix = new THREE.Matrix4();

    // Tree container typed
    const tree: TreeAssets = { group: new THREE.Group(), deadIDs: [] };
    scene.add(tree.group);

    // Noise texture
    const textureLoader = new THREE.TextureLoader();
    const noiseMap = textureLoader.load(
      "https://raw.githubusercontent.com/ceramicSoda/treeshader/main/assets/noise.png",
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
      }
    );

    // ShaderMaterial with typed-ish uniforms
    const baseUniforms = {
      ...THREE.UniformsLib.lights,
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(0x696969) },
      uColorB: { value: new THREE.Color(0x696969) },
      uColorC: { value: new THREE.Color(0x9c0202) },
      uNoiseMap: { value: noiseMap },
      uRaycast: { value: new THREE.Vector3(0, 0, 0) },
    } as unknown as LeavesUniforms & typeof THREE.UniformsLib;

    const leavesMaterial = new THREE.ShaderMaterial({
      lights: true,
      side: THREE.DoubleSide,
      uniforms: baseUniforms, // shader expects many uniforms from lights; keep narrow typing above
      vertexShader: /* glsl */ `
        uniform sampler2D uNoiseMap;
        uniform vec3 uBoxMin, uBoxSize, uRaycast;
        uniform float uTime;
        varying vec3 vObjectPos, vNormal, vWorldNormal; 
        varying float vCloseToGround;
        
        vec4 getTriplanar(sampler2D tex){
            vec4 xPixel = texture(tex, (vObjectPos.xy + uTime) / 3.0);
            vec4 yPixel = texture(tex, (vObjectPos.yz + uTime) / 3.0);
            vec4 zPixel = texture(tex, (vObjectPos.zx + uTime) / 3.0);
            vec4 combined = (xPixel + yPixel + zPixel) / 6.0;
            combined.xyz = combined.xyz * vObjectPos;
            return combined;
        }
        
        void main(){
            mat4 mouseDisplace = mat4(1.0);
            vec3 vWorldPos = vec3(modelMatrix * instanceMatrix * mouseDisplace * vec4(position, 1.0));
            vCloseToGround = clamp(vWorldPos.y, 0.0, 1.0);
            float offset = clamp(0.8 - distance(uRaycast, instanceMatrix[3].xyz), 0.0, 999.0); 
            offset = (pow(offset, 0.8) / 2.0) * vCloseToGround;
            mouseDisplace[3].xyz = vec3(offset);
            vNormal = normalMatrix * mat3(instanceMatrix) * mat3(mouseDisplace) * normalize(normal); 
            vWorldNormal = vec3(modelMatrix * instanceMatrix * mouseDisplace * vec4(normal, 0.0));
            vObjectPos = ((vWorldPos - uBoxMin) * 2.0) / uBoxSize - vec3(1.0); 
            vec4 noiseOffset = getTriplanar(uNoiseMap) * vCloseToGround; 
            vec4 newPos = instanceMatrix * mouseDisplace * vec4(position, 1.0); 
            newPos.xyz = newPos.xyz + noiseOffset.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * newPos;
        }
      `,
      fragmentShader: /* glsl */ `
        #include <common> 
        #include <lights_pars_begin>
        uniform vec3 uColorA, uColorB, uColorC;
        uniform float uTime;
        varying vec3 vObjectPos, vNormal, vWorldNormal; 
        varying float vCloseToGround;
        
        vec3 mix3 (vec3 v1, vec3 v2, vec3 v3, float fa){
            vec3 m; 
            fa > 0.7 ? m = mix(v2, v3, (fa - 0.5) * 2.0) : m = mix(v1, v2, fa * 2.0);
            return m;
        }

        float getPosColors(){
            float p = 0.0;
            p = smoothstep(0.2, 0.8, distance(vec3(0.0), vObjectPos));
            p = p * (-(vWorldNormal.g / 2.0) + 0.5) * (- vObjectPos.y / 9.0 + 0.5); 
            return p;
        }
        float getDiffuse(){
            float intensity = 0.0;
            for (int i = 0; i < directionalLights.length(); i++){
                float dotVal = dot(directionalLights[i].direction, vNormal);
                intensity += smoothstep(0.55, 1.0, dotVal) * 0.2 + pow(smoothstep(0.55, 1.0, dotVal), 0.5);
            }
            return intensity;
        }

        void main(){
            float gradMap = (getPosColors() + getDiffuse()) * vCloseToGround / 2.0 ;
            vec4 c = vec4(mix3(uColorA, uColorB, uColorC, gradMap), 1.0);
            gl_FragColor = vec4(pow(c.xyz, vec3(0.454545)), c.w);
        }
      `,
    });

    // Load GLTF
    const gltfLoader = new GLTFLoader();
    let isMounted = true;

    gltfLoader.load(
      "https://raw.githubusercontent.com/ceramicSoda/treeshader/main/assets/tree.glb",
      (gltf: GLTF) => {
        if (!isMounted) return;

        // find pole mesh
        const poleObj = gltf.scene.getObjectByName("Pole");
        if (poleObj && poleObj instanceof THREE.Mesh) {
          const poleMesh = poleObj;
          // keep existing texture if present
          const poleMat = new THREE.MeshToonMaterial({
            map: (poleMesh.material as THREE.MeshStandardMaterial)?.map ?? undefined,
          });
          poleMesh.material = poleMat;
          tree.pole = poleMesh;
        }

        // crown (position attribute used for instancing)
        const crownObj = gltf.scene.getObjectByName("Leaves");
        if (crownObj && crownObj instanceof THREE.Mesh && crownObj.geometry) {
          const crownMesh = crownObj as THREE.Mesh;
          tree.crown = crownMesh;

          const posAttr = crownMesh.geometry.attributes.position;
          if (!posAttr) {
            console.warn("Leaves geometry has no position attribute");
            return;
          }
          const leavesCount = posAttr.count;
          tree.leavesCount = leavesCount;

          // get Leaf geometry (single leaf mesh)
          const leafObj = gltf.scene.getObjectByName("Leaf");
          if (!leafObj || !(leafObj instanceof THREE.Mesh) || !leafObj.geometry) {
            console.warn("Leaf mesh not found or invalid");
            return;
          }
          tree.leafGeometry = leafObj.geometry as THREE.BufferGeometry;

          // update uniforms uBoxMin / uBoxSize if present
          const bbox = new THREE.Box3().setFromObject(crownMesh);
          if (Array.isArray((leavesMaterial.uniforms as unknown))) {
            // noop (keeps TS happy) - not expected
          } else {
            // set bounding box uniforms if they exist
            if ("uBoxMin" in leavesMaterial.uniforms) {
              (leavesMaterial.uniforms).uBoxMin.value.copy(bbox.min);
            } else {
              (leavesMaterial.uniforms).uBoxMin = { value: bbox.min.clone() };
            }
            if ("uBoxSize" in leavesMaterial.uniforms) {
              (leavesMaterial.uniforms).uBoxSize.value.copy(bbox.getSize(new THREE.Vector3()));
            } else {
              (leavesMaterial.uniforms).uBoxSize = { value: bbox.getSize(new THREE.Vector3()) };
            }
          }

          // create InstancedMesh
          const instanced = new THREE.InstancedMesh(tree.leafGeometry, leavesMaterial, leavesCount);
          for (let i = 0; i < leavesCount; i++) {
            const px = posAttr.getX(i);
            const py = posAttr.getY(i);
            const pz = posAttr.getZ(i);
            dummy.position.set(px, py, pz);

            // orient using normals if available
            const nAttr = crownMesh.geometry.attributes.normal;
            if (nAttr) {
              const nx = nAttr.getX(i);
              const ny = nAttr.getY(i);
              const nz = nAttr.getZ(i);
              dummy.lookAt(dummy.position.x + nx, dummy.position.y + ny, dummy.position.z + nz);
            }

            const s = Math.random() * 0.2 + 0.8;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            instanced.setMatrixAt(i, dummy.matrix);
          }

          tree.leaves = instanced;
          tree.group.add(instanced);
        }

        if (tree.pole) tree.group.add(tree.pole);

          const box = new THREE.Box3().setFromObject(tree.group);
        const center = box.getCenter(new THREE.Vector3());
        tree.group.position.sub(center);

        // track some deadIDs array as in original (optional)
        tree.deadIDs = [];
        for (let i = 0; i < 24; i++) {
          if (typeof tree.leavesCount === "number") {
            tree.deadIDs.push(Math.floor(Math.random() * tree.leavesCount));
          }
        }
      },
      undefined,
      (err) => {
        // handle load error gracefully
        // eslint-disable-next-line no-console
        console.error("GLTF load error:", err);
      }
    );

    // pointer move -> raycast against instanced mesh (leaves)
    function onPointerMove(e: MouseEvent) {
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);

      // Only raycast against the leaves instanced mesh + a large invisible plane if necessary
      const targets: THREE.Object3D[] = [];
      if (tree.leaves) targets.push(tree.leaves);
      // raycast
      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length) {
        const hit = hits[0];
        const point = hit.point;
        // update uniform if present
        const uRay = (leavesMaterial.uniforms)?.uRaycast;
        if (uRay && uRay.value instanceof THREE.Vector3) {
          uRay.value.copy(point);
        }
        // occasionally push a deadID to simulate falling leaves
        if (typeof hit.instanceId === "number" && Math.random() * 5 > 3 && tree.deadIDs) {
          tree.deadIDs.push(hit.instanceId);
        }
      }
    }

    window.addEventListener("mousemove", onPointerMove);

    // Resize handling
 function onWindowResize() {
  if (!container) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener("resize", onWindowResize);

    // animate loop
    let rafId = 0;
    function animate() {
      rafId = requestAnimationFrame(animate);

      // update shader time
      const uTime = (leavesMaterial.uniforms)?.uTime;
      if (uTime && typeof uTime.value === "number") uTime.value += 0.01;

      // optional "dead leaf" update: advance random dead leaf positions
      if (tree.deadIDs && tree.leaves) {
        // mutate some dead leaves (simplified behavior)
        const newDead: number[] = [];
        for (const id of tree.deadIDs) {
          if (typeof id !== "number") continue;
          tree.leaves.getMatrixAt(id, matrix);
          matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
          if (dummy.position.y > 0) {
            dummy.position.y -= 0.04;
            dummy.position.x += Math.random() / 5 - 0.11;
            dummy.position.z += Math.random() / 5 - 0.11;
            dummy.rotation.x += 0.2;
            dummy.updateMatrix();
            tree.leaves.setMatrixAt(id, dummy.matrix);
            newDead.push(id);
          }
        }
        if (newDead.length) tree.leaves.instanceMatrix.needsUpdate = true;
      }

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // cleanup on unmount
    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("resize", onWindowResize);
      controls.dispose();

      // dispose instanced mesh & its geometry/material
      if (tree.leaves) {
        tree.leaves.geometry.dispose();
        if (Array.isArray(tree.leaves.material)) {
          tree.leaves.material.forEach((m) => m.dispose());
        } else {
          tree.leaves.material.dispose();
        }
      }

      if (tree.pole) {
        tree.pole.geometry.dispose();
        if (Array.isArray(tree.pole.material)) {
          tree.pole.material.forEach((m) => m.dispose());
        } else {
          tree.pole.material.dispose();
        }
      }

      leavesMaterial.dispose();
      noiseMap.dispose();

      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [width, height]);

  return <div ref={mountRef} style={{ width: "300px", height: "300px", right: "0"}}>
     </div>;
}