// import { useEffect, useRef } from 'react';
// import gsap from 'gsap';

// const BOX     = { top: '#f4f1ea', front: '#e7e2d6', back: '#e7e2d6', right: '#d3cdbd', left: '#d3cdbd', bottom: '#b8b19d' };
// const CLASP   = { top: '#d7dde1', front: '#b8c0c6', back: '#b8c0c6', right: '#94a0a7', left: '#94a0a7', bottom: '#94a0a7' };
// const AMBER   = { top: '#eabb5f', front: '#e0a63f', back: '#e0a63f', right: '#b7822c', left: '#b7822c', bottom: '#8f6621' };
// const CAP     = { top: '#ffffff', front: '#efefee', back: '#efefee', right: '#d5d5d3', left: '#d5d5d3', bottom: '#d5d5d3' };
// const BARREL  = { top: '#eef3f2', front: '#dbe3e1', back: '#dbe3e1', right: '#c0c9c7', left: '#c0c9c7', bottom: '#a3aca9' };
// const PLUNGER = { top: '#f2a35c', front: '#e8883a', back: '#e8883a', right: '#c06e2a', left: '#c06e2a', bottom: '#c06e2a' };
// const NEEDLE  = { top: '#c7ccd0', front: '#a9afb4', back: '#a9afb4', right: '#888e93', left: '#888e93', bottom: '#888e93' };
// const THERM   = { top: '#f7f5f0', front: '#eae7de', back: '#eae7de', right: '#d2cec2', left: '#d2cec2', bottom: '#d2cec2' };
// const TIP     = { top: '#e35a5a', front: '#d64545', back: '#d64545', right: '#a83636', left: '#a83636', bottom: '#a83636' };
// const MINT    = { top: '#67c2a3', front: '#4fae8f', back: '#4fae8f', right: '#3a8a70', left: '#3a8a70', bottom: '#3a8a70' };
// const PILL    = { top: '#f4f1ea', front: '#e7e2d6', back: '#e7e2d6', right: '#c9c3b3', left: '#c9c3b3', bottom: '#c9c3b3' };

// export default function MedicalProducts3D({ compact = false }) {
//   const stageRef = useRef(null);
//   const sceneRef = useRef(null);
//   const hintRef = useRef(null);

//   useEffect(() => {
//     const scene = sceneRef.current;
//     const stage = stageRef.current;
//     if (!scene || !stage) return;

//     const parts = [];
//     const allBoxes = [];

//     function makeFace(w, h, color, transform) {
//       const el = document.createElement('div');
//       Object.assign(el.style, {
//         position: 'absolute',
//         left: '50%',
//         top: '50%',
//         width: w + 'px',
//         height: h + 'px',
//         marginLeft: (-w / 2) + 'px',
//         marginTop: (-h / 2) + 'px',
//         background: color,
//         backfaceVisibility: 'hidden',
//         transform,
//       });
//       return el;
//     }

//     function makeCuboid(opts) {
//       const {
//         w, h, d,
//         x = 0, y = 0, z = 0,
//         rx = 0, ry = 0, rz = 0,
//         colors, radius = 0,
//         parent = scene,
//         nested = false,
//       } = opts;

//       const el = document.createElement('div');
//       Object.assign(el.style, {
//         position: 'absolute',
//         left: '50%',
//         top: '50%',
//         transformStyle: 'preserve-3d',
//         borderRadius: radius ? radius + 'px' : '',
//       });

//       el.appendChild(makeFace(w, h, colors.front, `translateZ(${d / 2}px)`));
//       el.appendChild(makeFace(w, h, colors.back, `rotateY(180deg) translateZ(${d / 2}px)`));
//       el.appendChild(makeFace(d, h, colors.right, `rotateY(90deg) translateZ(${w / 2}px)`));
//       el.appendChild(makeFace(d, h, colors.left, `rotateY(-90deg) translateZ(${w / 2}px)`));
//       el.appendChild(makeFace(w, d, colors.top, `rotateX(90deg) translateZ(${h / 2}px)`));
//       el.appendChild(makeFace(w, d, colors.bottom, `rotateX(-90deg) translateZ(${h / 2}px)`));

//       parent.appendChild(el);
//       allBoxes.push(el);

//       if (nested) {
//         gsap.set(el, { x, y, z, rotationX: rx, rotationY: ry, rotationZ: rz });
//       } else {
//         gsap.set(el, { x, y, z, rotationX: rx, rotationY: ry, rotationZ: rz, scale: 0, opacity: 0 });
//         parts.push(el);
//       }
//       return el;
//     }

//     function mk2d(parent, css) {
//       const d = document.createElement('div');
//       Object.assign(d.style, { position: 'absolute', ...css });
//       parent.appendChild(d);
//     }

//     // First aid box
//     const boxW = 170, boxH = 90, boxD = 130;
//     const box = makeCuboid({ w: boxW, h: boxH, d: boxD, colors: BOX, radius: 8 });

//     const boxFront = box.firstChild;
//     mk2d(boxFront, { width: '18px', height: '54px', left: (boxW / 2 - 9) + 'px', top: (boxH / 2 - 45) + 'px', background: '#d64545' });
//     mk2d(boxFront, { width: '54px', height: '18px', left: (boxW / 2 - 27) + 'px', top: (boxH / 2 - 27) + 'px', background: '#d64545' });
//     makeCuboid({ w: 20, h: 10, d: 4, y: boxH / 2 - 6, z: boxD / 2 + 2, colors: CLASP, radius: 2, parent: box, nested: true });

//     // Pill bottle + cap
//     const bottleH = 70, bottleY = boxH / 2 - bottleH / 2;
//     const bottle = makeCuboid({ w: 34, h: bottleH, d: 34, x: boxW / 2 + 40, y: bottleY, colors: AMBER, radius: 14 });
//     mk2d(bottle.firstChild, { width: '22px', height: '26px', left: '6px', top: '20px', background: 'rgba(255,255,255,0.92)', borderRadius: '2px' });
//     makeCuboid({ w: 36, h: 14, d: 36, x: boxW / 2 + 40, y: bottleY - bottleH / 2 - 7, colors: CAP, radius: 10 });

//     // Capsule
//     const capsuleY = boxH / 2 - 7;
//     makeCuboid({ w: 15, h: 14, d: 14, x: -boxW / 2 - 30, y: capsuleY, z: 40, colors: MINT, radius: 7 });
//     makeCuboid({ w: 15, h: 14, d: 14, x: -boxW / 2 - 15, y: capsuleY, z: 40, colors: PILL, radius: 7 });

//     // Thermometer
//     const thermD = 100, thermY = boxH / 2 - 3;
//     const therm = makeCuboid({ w: 8, h: 6, d: thermD, x: -30, y: thermY, z: 100, ry: 18, colors: THERM, radius: 3 });
//     makeCuboid({ w: 8, h: 6, d: 14, z: -(thermD / 2 - 7), colors: TIP, radius: 3, parent: therm, nested: true });

//     // Syringe
//     const barrelD = 120;
//     const syringe = makeCuboid({
//       w: 10, h: 10, d: barrelD,
//       x: 4, y: -(boxH / 2 + 13), z: -14,
//       rx: 6, ry: 30,
//       colors: BARREL, radius: 4,
//     });
//     makeCuboid({ w: 14, h: 14, d: 16, z: -(barrelD / 2 - 8), colors: PLUNGER, radius: 3, parent: syringe, nested: true });
//     makeCuboid({ w: 3, h: 3, d: 22, z: barrelD / 2 + 11, colors: NEEDLE, parent: syringe, nested: true });

//     gsap.set(scene, { rotationX: -18, rotationY: -32, transformPerspective: 1050 });

//     gsap.to(parts, {
//       opacity: 1,
//       scale: 1,
//       duration: 0.7,
//       stagger: 0.08,
//       ease: 'back.out(1.6)',
//       delay: 0.2,
//     });

//     const idle = gsap.to(scene, {
//       rotationY: '+=360',
//       duration: 18,
//       repeat: -1,
//       ease: 'none',
//       delay: 1.2,
//     });

//     let dragging = false;
//     let startX = 0, startY = 0, startRotX = 0, startRotY = 0;
//     let resumeTimeout = null;

//     function pointerDown(e) {
//       dragging = true;
//       idle.pause();
//       if (resumeTimeout) clearTimeout(resumeTimeout);
//       const p = e.touches ? e.touches[0] : e;
//       startX = p.clientX;
//       startY = p.clientY;
//       startRotX = gsap.getProperty(scene, 'rotationX');
//       startRotY = gsap.getProperty(scene, 'rotationY');
//       if (hintRef.current) hintRef.current.textContent = 'First aid box, pill bottle, capsule, thermometer and syringe.';
//     }

//     function pointerMove(e) {
//       if (!dragging) return;
//       const p = e.touches ? e.touches[0] : e;
//       const dx = p.clientX - startX;
//       const dy = p.clientY - startY;
//       const newRotX = Math.max(-70, Math.min(70, startRotX - dy * 0.4));
//       gsap.set(scene, { rotationY: startRotY + dx * 0.4, rotationX: newRotX });
//     }

//     function pointerUp() {
//       if (!dragging) return;
//       dragging = false;
//       resumeTimeout = setTimeout(() => idle.play(), 900);
//     }

//     stage.addEventListener('mousedown', pointerDown);
//     window.addEventListener('mousemove', pointerMove);
//     window.addEventListener('mouseup', pointerUp);
//     stage.addEventListener('touchstart', pointerDown, { passive: true });
//     window.addEventListener('touchmove', pointerMove, { passive: true });
//     window.addEventListener('touchend', pointerUp);

//     return () => {
//       idle.kill();
//       gsap.killTweensOf(parts);
//       if (resumeTimeout) clearTimeout(resumeTimeout);
//       stage.removeEventListener('mousedown', pointerDown);
//       window.removeEventListener('mousemove', pointerMove);
//       window.removeEventListener('mouseup', pointerUp);
//       stage.removeEventListener('touchstart', pointerDown);
//       window.removeEventListener('touchmove', pointerMove);
//       window.removeEventListener('touchend', pointerUp);
//       allBoxes.forEach((b) => b.remove());
//     };
//   }, []);

//   return (
//     <div
//       style={{
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         justifyContent: 'center',
//         width: '100%',
//         height: '100%',
//         overflow: 'hidden',
//         userSelect: 'none',
//       }}
//     >
//       <div
//         style={{
//           transform: compact ? 'scale(0.48)' : 'scale(1)',
//           transformOrigin: 'center center',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//         }}
//       >
//         <div
//           ref={stageRef}
//           style={{
//             width: 380,
//             height: 380,
//             perspective: 1050,
//             touchAction: 'none',
//             cursor: 'grab',
//           }}
//         >
//           <div
//             ref={sceneRef}
//             style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
//           >
//             <div
//               style={{
//                 position: 'absolute',
//                 left: '50%',
//                 top: '50%',
//                 width: 260,
//                 height: 260,
//                 marginLeft: -130,
//                 marginTop: -130,
//                 borderRadius: '50%',
//                 background: 'radial-gradient(closest-side, rgba(0,0,0,0.45), rgba(0,0,0,0))',
//                 transform: 'rotateX(90deg) translateZ(-58px)',
//               }}
//             />
//           </div>
//         </div>
//       </div>
//       {!compact && (
//         <p ref={hintRef} style={{ fontSize: 13, color: '#8b8f9c', margin: 0, textAlign: 'center', maxWidth: 320 }}>
//           Drag to rotate — same six-box trick, new set.
//         </p>
//       )}
//     </div>
//   );
// }


import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const BOX     = { top: '#f4f1ea', front: '#e7e2d6', back: '#e7e2d6', right: '#d3cdbd', left: '#d3cdbd', bottom: '#b8b19d' };
const CLASP   = { top: '#d7dde1', front: '#b8c0c6', back: '#b8c0c6', right: '#94a0a7', left: '#94a0a7', bottom: '#94a0a7' };
const AMBER   = { top: '#eabb5f', front: '#e0a63f', back: '#e0a63f', right: '#b7822c', left: '#b7822c', bottom: '#8f6621' };
const CAP     = { top: '#ffffff', front: '#efefee', back: '#efefee', right: '#d5d5d3', left: '#d5d5d3', bottom: '#d5d5d3' };
const BARREL  = { top: '#eef3f2', front: '#dbe3e1', back: '#dbe3e1', right: '#c0c9c7', left: '#c0c9c7', bottom: '#a3aca9' };
const PLUNGER = { top: '#f2a35c', front: '#e8883a', back: '#e8883a', right: '#c06e2a', left: '#c06e2a', bottom: '#c06e2a' };
const NEEDLE  = { top: '#c7ccd0', front: '#a9afb4', back: '#a9afb4', right: '#888e93', left: '#888e93', bottom: '#888e93' };
const THERM   = { top: '#f7f5f0', front: '#eae7de', back: '#eae7de', right: '#d2cec2', left: '#d2cec2', bottom: '#d2cec2' };
const TIP     = { top: '#e35a5a', front: '#d64545', back: '#d64545', right: '#a83636', left: '#a83636', bottom: '#a83636' };
const MINT    = { top: '#67c2a3', front: '#4fae8f', back: '#4fae8f', right: '#3a8a70', left: '#3a8a70', bottom: '#3a8a70' };
const PILL    = { top: '#f4f1ea', front: '#e7e2d6', back: '#e7e2d6', right: '#c9c3b3', left: '#c9c3b3', bottom: '#c9c3b3' };
const STEEL   = { top: '#4a6479', front: '#3a5266', back: '#3a5266', right: '#2a3d4e', left: '#2a3d4e', bottom: '#1c2a37' };
const SILVER  = { top: '#c7ccd0', front: '#a9afb4', back: '#a9afb4', right: '#888e93', left: '#888e93', bottom: '#666b70' };
const DARK    = { top: '#4a4e55', front: '#3a3d43', back: '#3a3d43', right: '#2a2c31', left: '#2a2c31', bottom: '#1a1c1f' };
const BAG     = { top: '#bce0f5', front: '#a5d2ec', back: '#a5d2ec', right: '#7fb7d8', left: '#7fb7d8', bottom: '#5c8eaa' };

export default function MedicalProducts3D({ compact = false }) {
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const stage = stageRef.current;
    if (!scene || !stage) return;

    const parts = [];
    const allBoxes = [];

    function makeFace(w, h, color, transform, radius) {
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: w + 'px',
        height: h + 'px',
        marginLeft: (-w / 2) + 'px',
        marginTop: (-h / 2) + 'px',
        background: color,
        backfaceVisibility: 'hidden',
        transform,
        borderRadius: radius || '',
      });
      return el;
    }

    function makeCuboid(opts) {
      const {
        w, h, d,
        x = 0, y = 0, z = 0,
        rx = 0, ry = 0, rz = 0,
        colors, radius = 0, round = false,
        parent = scene, nested = false,
      } = opts;

      const el = document.createElement('div');
      const capR = round ? '50%' : (radius ? radius + 'px' : '');
      const edgeR = radius ? Math.min(radius, 10) + 'px' : '';
      Object.assign(el.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transformStyle: 'preserve-3d',
      });

      el.appendChild(makeFace(w, h, colors.front, `translateZ(${d / 2}px)`, capR));
      el.appendChild(makeFace(w, h, colors.back, `rotateY(180deg) translateZ(${d / 2}px)`, capR));
      el.appendChild(makeFace(d, h, colors.right, `rotateY(90deg) translateZ(${w / 2}px)`, edgeR));
      el.appendChild(makeFace(d, h, colors.left, `rotateY(-90deg) translateZ(${w / 2}px)`, edgeR));
      el.appendChild(makeFace(w, d, colors.top, `rotateX(90deg) translateZ(${h / 2}px)`, edgeR));
      el.appendChild(makeFace(w, d, colors.bottom, `rotateX(-90deg) translateZ(${h / 2}px)`, edgeR));

      parent.appendChild(el);
      allBoxes.push(el);

      if (nested) {
        gsap.set(el, { x, y, z, rotationX: rx, rotationY: ry, rotationZ: rz });
      } else {
        gsap.set(el, { x, y, z, rotationX: rx, rotationY: ry, rotationZ: rz, scale: 0, opacity: 0 });
        parts.push(el);
      }
      return el;
    }

    function mk2d(parent, css) {
      const d = document.createElement('div');
      Object.assign(d.style, { position: 'absolute', ...css });
      parent.appendChild(d);
    }

    // ===== First aid box (consumables) =====
    const boxW = 170, boxH = 90, boxD = 130;
    const box = makeCuboid({ w: boxW, h: boxH, d: boxD, x: -60, y: 0, z: -10, colors: BOX, radius: 8 });
    mk2d(box.children[0], {
      width: '18px', height: '54px',
      left: (boxW / 2 - 9) + 'px', top: (boxH / 2 - 45) + 'px',
      background: '#d64545',
    });
    mk2d(box.children[0], {
      width: '54px', height: '18px',
      left: (boxW / 2 - 27) + 'px', top: (boxH / 2 - 27) + 'px',
      background: '#d64545',
    });
    makeCuboid({ w: 20, h: 10, d: 4, x: -60, y: boxH / 2 - 6, z: boxD / 2 - 8, colors: CLASP, radius: 2 });

    // ===== Pill bottle + cap (consumables) =====
    const bottleH = 70, bottleY = boxH / 2 - bottleH / 2;
    const bottle = makeCuboid({
      w: 34, h: bottleH, d: 34,
      x: 140, y: bottleY, z: 25,
      colors: AMBER, radius: 14,
    });
    mk2d(bottle.children[0], {
      width: '22px', height: '26px', left: '6px', top: '20px',
      background: 'rgba(255,255,255,0.92)', borderRadius: '2px',
    });
    makeCuboid({ w: 36, h: 14, d: 36, x: 140, y: bottleY - bottleH / 2 - 7, z: 25, colors: CAP, radius: 10 });

    // ===== Capsule (consumables) =====
    const capsuleY = boxH / 2 - 7;
    makeCuboid({ w: 15, h: 14, d: 14, x: -150, y: capsuleY, z: 55, colors: MINT, radius: 7 });
    makeCuboid({ w: 15, h: 14, d: 14, x: -135, y: capsuleY, z: 55, colors: PILL, radius: 7 });

    // ===== Thermometer (diagnostic device) =====
    const thermD = 100, thermY = boxH / 2 - 3;
    const therm = makeCuboid({
      w: 8, h: 6, d: thermD,
      x: -100, y: thermY, z: 115, ry: 18,
      colors: THERM, radius: 3,
    });
    makeCuboid({ w: 8, h: 6, d: 14, z: -(thermD / 2 - 7), colors: TIP, radius: 3, parent: therm, nested: true });

    // ===== Syringe (surgical / consumable) =====
    const barrelD = 120;
    const syringe = makeCuboid({
      w: 10, h: 10, d: barrelD,
      x: 15, y: -(boxH / 2 + 13), z: 0, rx: 6, ry: 30,
      colors: BARREL, radius: 4,
    });
    makeCuboid({ w: 14, h: 14, d: 16, z: -(barrelD / 2 - 8), colors: PLUNGER, radius: 3, parent: syringe, nested: true });
    makeCuboid({ w: 3, h: 3, d: 22, z: barrelD / 2 + 11, colors: NEEDLE, parent: syringe, nested: true });

    // ===== Scalpel (surgical instrument) =====
    const sclW = 50;
    const scalpel = makeCuboid({
      w: sclW, h: 6, d: 6,
      x: 90, y: 38, z: 105, rz: -10,
      colors: STEEL, radius: 2,
    });
    makeCuboid({
      w: 14, h: 4, d: 4,
      x: sclW / 2 - 7, y: -1,
      colors: SILVER, radius: 1, parent: scalpel, nested: true,
    });
    mk2d(scalpel.children[4], {
      width: '6px', height: '26px',
      left: '18px', top: '4px',
      background: 'rgba(255,255,255,0.18)', borderRadius: '2px',
    });

    // ===== IV drip stand (hospital equipment) =====
    const ivX = 175, ivZ = -80;
    makeCuboid({ w: 34, h: 4, d: 24, x: ivX, y: 43, z: ivZ, colors: DARK, radius: 2 });
    const pole = makeCuboid({
      w: 6, h: 112, d: 6,
      x: ivX, y: -11, z: ivZ,
      colors: SILVER, radius: 2,
    });
    makeCuboid({ w: 4, h: 4, d: 26, x: ivX, y: -69, z: ivZ + 10, colors: SILVER, radius: 2, parent: pole, nested: true });
    const bagH = 28;
    makeCuboid({
      w: 18, h: bagH, d: 6,
      x: ivX, y: -69 + 15, z: ivZ + 22,
      colors: BAG, radius: 4,
    });
    makeCuboid({ w: 2, h: 38, d: 2, x: ivX, y: -40, z: ivZ + 22, colors: BARREL, radius: 1 });

    gsap.set(scene, { rotationX: -16, rotationY: -32, transformPerspective: 1150 });

    gsap.to(parts, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      stagger: 0.08,
      ease: 'back.out(1.6)',
      delay: 0.2,
    });

    const idle = gsap.to(scene, {
      rotationY: '+=360',
      duration: 18,
      repeat: -1,
      ease: 'none',
      delay: 1.2,
    });

    let dragging = false;
    let startX = 0, startY = 0, startRotX = 0, startRotY = 0;
    let resumeTimeout = null;

    function pointerDown(e) {
      dragging = true;
      idle.pause();
      if (resumeTimeout) clearTimeout(resumeTimeout);
      const p = e.touches ? e.touches[0] : e;
      startX = p.clientX;
      startY = p.clientY;
      startRotX = gsap.getProperty(scene, 'rotationX');
      startRotY = gsap.getProperty(scene, 'rotationY');
      if (hintRef.current) hintRef.current.textContent = 'Box, bottle, capsule, thermometer, syringe, scalpel and IV drip.';
    }

    function pointerMove(e) {
      if (!dragging) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - startX;
      const dy = p.clientY - startY;
      const newRotX = Math.max(-70, Math.min(70, startRotX - dy * 0.4));
      gsap.set(scene, { rotationY: startRotY + dx * 0.4, rotationX: newRotX });
    }

    function pointerUp() {
      if (!dragging) return;
      dragging = false;
      resumeTimeout = setTimeout(() => idle.play(), 900);
    }

    stage.addEventListener('mousedown', pointerDown);
    window.addEventListener('mousemove', pointerMove);
    window.addEventListener('mouseup', pointerUp);
    stage.addEventListener('touchstart', pointerDown, { passive: true });
    window.addEventListener('touchmove', pointerMove, { passive: true });
    window.addEventListener('touchend', pointerUp);

    return () => {
      idle.kill();
      gsap.killTweensOf(parts);
      if (resumeTimeout) clearTimeout(resumeTimeout);
      stage.removeEventListener('mousedown', pointerDown);
      window.removeEventListener('mousemove', pointerMove);
      window.removeEventListener('mouseup', pointerUp);
      stage.removeEventListener('touchstart', pointerDown);
      window.removeEventListener('touchmove', pointerMove);
      window.removeEventListener('touchend', pointerUp);
      allBoxes.forEach((b) => b.remove());
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          transform: compact ? 'scale(0.48)' : 'scale(1)',
          transformOrigin: 'center center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          ref={stageRef}
          style={{
            width: 430,
            height: 390,
            perspective: 1150,
            touchAction: 'none',
            cursor: 'grab',
          }}
        >
          <div
            ref={sceneRef}
            style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 300,
                height: 300,
                marginLeft: -150,
                marginTop: -150,
                borderRadius: '50%',
                background: 'radial-gradient(closest-side, rgba(0,0,0,0.45), rgba(0,0,0,0))',
                transform: 'rotateX(90deg) translateZ(-58px)',
              }}
            />
          </div>
        </div>
      </div>
      {!compact && (
        <p ref={hintRef} style={{ fontSize: 13, color: '#8b8f9c', margin: 0, textAlign: 'center', maxWidth: 320 }}>
          Drag to rotate — same six-box trick, new set.
        </p>
      )}
    </div>
  );
}