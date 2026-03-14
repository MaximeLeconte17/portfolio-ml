"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function WoolMaterialScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const pointLight = new THREE.PointLight(0xffffff, 2.5);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    const ambient = new THREE.AmbientLight(0xffffff, 2.35);
    scene.add(ambient);

    // Variables pour le cube / drag / inertie
    const cubeSize = 2;
    let cube: THREE.Mesh | null = null;
    let isDragging = false;
    let previousX = 0;
    let previousY = 0;
    let velocityX = 0;
    let velocityY = 0;
    const dragSensitivity = 0.005; // ajuste la sensibilité du drag
    const friction = 0.95;
    let autoRotate = true;

    // Resize handler
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onWindowResize);

    // Gestion des pointer events (support souris + tactile)
    function onPointerDown(e: PointerEvent) {
      isDragging = true;
      autoRotate = false; // stop rotation auto dès qu'on commence à drag
      previousX = e.clientX;
      previousY = e.clientY;

    }

    function onPointerUp(e: PointerEvent) {
      isDragging = false;

      (e.target as Element).releasePointerCapture?.((e).pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDragging || !cube) return;

      const deltaX = e.clientX - previousX;
      const deltaY = e.clientY - previousY;

      // Sens naturel : déplacer souris vers la droite → cube tourne vers la droite
      cube.rotation.y += -deltaX * dragSensitivity;
      cube.rotation.x += deltaY * dragSensitivity;

      velocityX = -deltaX * dragSensitivity;
      velocityY = deltaY * dragSensitivity;

      previousX = e.clientX;
      previousY = e.clientY;
    }

    // On attache les handlers au renderer.domElement (meilleur scope que window)
    renderer.domElement.style.touchAction = "none"; // empêche le scroll pendant le drag
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);

    // --- Chargement de la texture wood, puis création du cube ---
    const texLoader = new THREE.TextureLoader();
    const woodUrl = "/models/textures/wood_table_diff_4k.jpg";

    const faceTexts = ["Projets", "Contact", "Présentation", "Autre", "Face5", "Face6"];

    // charge la texture et ensuite construit le cube
    const woodTexture = texLoader.load(
      woodUrl,
      (loadedTexture) => {
        // s'assurer que l'image html est disponible
        const img = loadedTexture.image as HTMLImageElement | HTMLCanvasElement | undefined;

        // fonction qui crée une CanvasTexture combinant wood + texte
        function createTexturedCanvas(text: string): THREE.CanvasTexture {
          const canvas = document.createElement("canvas");
          const size = 1024; // meilleur rendu; peut réduire à 512 si perf
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d")!;
          // dessiner l'image bois comme fond si disponible
          if (img instanceof HTMLImageElement || img instanceof HTMLCanvasElement) {
            // on étire l'image pour couvrir le canvas ; tu peux ajuster pour tiling si besoin
            ctx.drawImage(img, 0, 0, size, size);
          } else {
            // fallback
            ctx.fillStyle = "#6b4f3b";
            ctx.fillRect(0, 0, size, size);
          }

          // Optionnel : ajoute un léger overlay pour améliorer contraste texte
          ctx.fillStyle = "rgba(0,0,0,0.15)";
          ctx.fillRect(0, 0, size, size);

          // Texte
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 72px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // gérer wrap si texte long (simple)
          const lines = wrapText(ctx, text, size * 0.75);
          const startY = size / 2 - ((lines.length - 1) * 40);
          lines.forEach((line, i) => {
            ctx.fillText(line, size / 2, startY + i * 80);
          });

          const tex = new THREE.CanvasTexture(canvas);
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          tex.needsUpdate = true;
          return tex;
        }

        // helper pour effectuer un wrap simple
        function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
          const words = text.split(" ");
          const lines: string[] = [];
          let current = "";
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const test = current ? `${current} ${word}` : word;
            const metrics = ctx.measureText(test);
            if (metrics.width > maxWidth && current) {
              lines.push(current);
              current = word;
            } else {
              current = test;
            }
          }
          if (current) lines.push(current);
          return lines;
        }

        // créer un material par face (texture wood + texte)
        const materials = faceTexts.map((txt) =>
          new THREE.MeshStandardMaterial({
            map: createTexturedCanvas(txt),
            // Si tu veux utiliser normal/roughness, ajoute ici normalMap/roughnessMap
            // normalMap: loadedNormalTexture,
            // roughnessMap: loadedRoughnessTexture,
          })
        );

        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        cube = new THREE.Mesh(geometry, materials);
        scene.add(cube);
      },
      undefined,
      (err) => {
        console.error("Erreur chargement texture wood:", err);
        // fallback: cube gris si echec
        const materials = new Array(6).fill(
          new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        cube = new THREE.Mesh(geometry, materials);
        scene.add(cube);
      }
    );

    // Animation loop
    let rafId = 0;
    function animate() {
      rafId = requestAnimationFrame(animate);

      if (cube) {
        if (!isDragging) {
          // rotation automatique quand pas de drag et si autoRotate true
          if (autoRotate) {
            cube.rotation.y += 0.002;
            cube.rotation.x += 0.001;
          } else {
            // si on ne veut pas autoRotate mais on veut inertie au relâchement :
            cube.rotation.y += velocityX;
            cube.rotation.x += velocityY;

            velocityX *= friction;
            velocityY *= friction;
          }
        } else {
          // pendant le drag, inertie aussi s'applique pour fluidité
          cube.rotation.y += velocityX;
          cube.rotation.x += velocityY;

          velocityX *= friction;
          velocityY *= friction;
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    // CLEANUP
    return () => {
      // stop RAF
      cancelAnimationFrame(rafId);

      // remove listeners
      window.removeEventListener("resize", onWindowResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);

      // remove DOM
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // dispose scene resources
      scene.traverse((obj) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(obj as any).isMesh) return;
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            (m as THREE.Material).dispose();
            // dispose textures if any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mm = m as any;
            if (mm.map) mm.map.dispose();
            if (mm.normalMap) mm.normalMap.dispose();
            if (mm.roughnessMap) mm.roughnessMap.dispose();
          });
        } else if (mesh.material) {
          (mesh.material as THREE.Material).dispose();
        }
      });

      // dispose renderer
      renderer.dispose();
      // try to free GL context
      try {
        renderer.forceContextLoss();
      } catch {}
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
}