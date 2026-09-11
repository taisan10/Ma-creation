// import { useEffect, useRef } from 'react';
// import gsap from 'gsap';

// const DECK   = { top: '#4a4f57', front: '#3a3e45', back: '#3a3e45', right: '#2b2e34', left: '#2b2e34', bottom: '#1d1f23' };
// const SCREEN = { top: '#2b2e34', front: '#20232a', back: '#20232a', right: '#181a1f', left: '#181a1f', bottom: '#101114' };
// const TOWER  = { top: '#494e56', front: '#383c43', back: '#383c43', right: '#292c31', left: '#292c31', bottom: '#1a1c1f' };
// const MOUSE  = { top: '#d8dbe0', front: '#c3c7cd', back: '#c3c7cd', right: '#a3a8ae', left: '#a3a8ae', bottom: '#82868c' };

// export default function ITProducts3D({ compact = false }) {
//   const stageRef = useRef(null);
//   const sceneRef = useRef(null);
//   const hintRef = useRef(null);

//   useEffect(() => {
//     const scene = sceneRef.current;
//     const stage = stageRef.current;
//     if (!scene || !stage) return;

//     const parts = [];
//     const allBoxes = [];

//     function makeFace(w, h, color, transform, radius) {
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
//         borderRadius: radius || '',
//       });
//       return el;
//     }

//     function makeCuboid(opts) {
//       const {
//         w, h, d,
//         x = 0, y = 0, z = 0,
//         rx = 0, ry = 0, rz = 0,
//         colors, radius = 0, round = false,
//         parent = scene, nested = false,
//       } = opts;

//       const el = document.createElement('div');
//       const capR = round ? '50%' : (radius ? radius + 'px' : '');
//       const edgeR = radius ? Math.min(radius, 10) + 'px' : '';
//       Object.assign(el.style, {
//         position: 'absolute',
//         left: '50%',
//         top: '50%',
//         transformStyle: 'preserve-3d',
//       });

//       el.appendChild(makeFace(w, h, colors.front, `translateZ(${d / 2}px)`, capR));
//       el.appendChild(makeFace(w, h, colors.back, `rotateY(180deg) translateZ(${d / 2}px)`, capR));
//       el.appendChild(makeFace(d, h, colors.right, `rotateY(90deg) translateZ(${w / 2}px)`, edgeR));
//       el.appendChild(makeFace(d, h, colors.left, `rotateY(-90deg) translateZ(${w / 2}px)`, edgeR));
//       el.appendChild(makeFace(w, d, colors.top, `rotateX(90deg) translateZ(${h / 2}px)`, edgeR));
//       el.appendChild(makeFace(w, d, colors.bottom, `rotateX(-90deg) translateZ(${h / 2}px)`, edgeR));

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

//     function addGroup(opts = {}) {
//       const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = scene } = opts;
//       const el = document.createElement('div');
//       Object.assign(el.style, {
//         position: 'absolute',
//         left: '50%',
//         top: '50%',
//         transformStyle: 'preserve-3d',
//       });
//       parent.appendChild(el);
//       gsap.set(el, { x, y, z, rotationX: rx, rotationY: ry, rotationZ: rz });
//       return el;
//     }

//     function mk2d(parent, css) {
//       const d = document.createElement('div');
//       Object.assign(d.style, { position: 'absolute', ...css });
//       parent.appendChild(d);
//     }

//     // Laptop: deck + screen hinged open at a natural resting angle
//     const deckW = 140, deckH = 8, deckD = 100;
//     const deck = makeCuboid({ w: deckW, h: deckH, d: deckD, x: -20, y: 14, z: 0, colors: DECK, radius: 4 });
//     mk2d(deck.children[4], {
//       width: '50px', height: '34px',
//       left: (deckW / 2 - 25) + 'px', top: (deckD / 2 - 45) + 'px',
//       background: 'rgba(0,0,0,0.18)', borderRadius: '4px',
//     });

//     const hinge = addGroup({ x: -20, y: 14 - deckH / 2, z: -(deckD / 2), parent: scene });
//     const screenW = 140, screenH = 90, screenD = 6;
//     const screen = makeCuboid({
//       w: screenW, h: screenH, d: screenD,
//       y: -(screenH / 2), z: screenD / 2, rx: -98,
//       colors: SCREEN, radius: 4, parent: hinge,
//     });
//     mk2d(screen.children[0], {
//       width: (screenW - 16) + 'px', height: (screenH - 16) + 'px',
//       left: '8px', top: '8px',
//       background: 'linear-gradient(160deg, #3a6ea5, #1e3a5c)', borderRadius: '2px',
//     });

//     // Desktop tower
//     const towerW = 50, towerH = 110, towerD = 90;
//     const tower = makeCuboid({
//       w: towerW, h: towerH, d: towerD,
//       x: 120, y: 14 - (towerH - deckH) / 2 + 7, z: -20,
//       colors: TOWER, radius: 4,
//     });
//     mk2d(tower.children[0], {
//       width: '6px', height: '6px', borderRadius: '50%',
//       left: '10px', top: '14px', background: '#5fd68a', boxShadow: '0 0 6px #5fd68a',
//     });
//     [0, 1, 2].forEach((i) => {
//       mk2d(tower.children[0], {
//         width: '26px', height: '3px',
//         left: '12px', top: (40 + i * 10) + 'px',
//         background: 'rgba(0,0,0,0.35)', borderRadius: '2px',
//       });
//     });

//     // Mouse
//     const mouse = makeCuboid({
//       w: 30, h: 16, d: 50,
//       x: -120, y: 14 + deckH / 2 + 8 - 8, z: 60, ry: -10,
//       colors: MOUSE, radius: 14,
//     });
//     mk2d(mouse.children[4], {
//       width: '2px', height: '18px', left: '14px', top: '16px', background: 'rgba(0,0,0,0.3)',
//     });

//     gsap.set(scene, { rotationX: -18, rotationY: -30, transformPerspective: 1050 });

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
//       if (hintRef.current) hintRef.current.textContent = 'Laptop, desktop tower and mouse.';
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
//                 transform: 'rotateX(90deg) translateZ(-50px)',
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

const DECK    = { top: '#4a4f57', front: '#3a3e45', back: '#3a3e45', right: '#2b2e34', left: '#2b2e34', bottom: '#1d1f23' };
const SCREEN  = { top: '#2b2e34', front: '#20232a', back: '#20232a', right: '#181a1f', left: '#181a1f', bottom: '#101114' };
const TOWER   = { top: '#494e56', front: '#383c43', back: '#383c43', right: '#292c31', left: '#292c31', bottom: '#1a1c1f' };
const PRINTER = { top: '#f0ece3', front: '#ddd8cc', back: '#ddd8cc', right: '#bdb7a9', left: '#bdb7a9', bottom: '#928c7b' };
const ROUTER  = { top: '#3d4249', front: '#2c3137', back: '#2c3137', right: '#1f2329', left: '#1f2329', bottom: '#12151a' };
const PLATE   = { top: '#d8dbe0', front: '#c3c7cd', back: '#c3c7cd', right: '#a3a8ae', left: '#a3a8ae', bottom: '#82868c' };

export default function ITProducts3D({ compact = false }) {
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

    function addGroup(opts = {}) {
      const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = scene } = opts;
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transformStyle: 'preserve-3d',
      });
      parent.appendChild(el);
      gsap.set(el, { x, y, z, rotationX: rx, rotationY: ry, rotationZ: rz });
      return el;
    }

    function mk2d(parent, css) {
      const d = document.createElement('div');
      Object.assign(d.style, { position: 'absolute', ...css });
      parent.appendChild(d);
    }

    // ===== Laptop =====
    const deckW = 140, deckH = 8, deckD = 100;
    const deck = makeCuboid({ w: deckW, h: deckH, d: deckD, x: -20, y: 14, z: 0, colors: DECK, radius: 4 });
    mk2d(deck.children[4], {
      width: '50px', height: '34px',
      left: (deckW / 2 - 25) + 'px', top: (deckD / 2 - 45) + 'px',
      background: 'rgba(0,0,0,0.18)', borderRadius: '4px',
    });

    const hinge = addGroup({ x: -20, y: 14 - deckH / 2, z: -(deckD / 2) });
    const screenW = 140, screenH = 90, screenD = 6;
    const screen = makeCuboid({
      w: screenW, h: screenH, d: screenD,
      y: -(screenH / 2), z: screenD / 2, rx: -98,
      colors: SCREEN, radius: 4, parent: hinge,
    });
    mk2d(screen.children[0], {
      width: (screenW - 16) + 'px', height: (screenH - 16) + 'px',
      left: '8px', top: '8px',
      background: 'linear-gradient(160deg, #3a6ea5, #1e3a5c)', borderRadius: '2px',
    });

    // ===== Desktop tower =====
    const towerW = 50, towerH = 110, towerD = 90;
    const tower = makeCuboid({
      w: towerW, h: towerH, d: towerD,
      x: 120, y: 14 - (towerH - deckH) / 2 + 7, z: -40,
      colors: TOWER, radius: 4,
    });
    mk2d(tower.children[0], {
      width: '6px', height: '6px', borderRadius: '50%',
      left: '10px', top: '14px', background: '#5fd68a', boxShadow: '0 0 6px #5fd68a',
    });
    [0, 1, 2].forEach((i) => {
      mk2d(tower.children[0], {
        width: '26px', height: '3px',
        left: '12px', top: (40 + i * 10) + 'px',
        background: 'rgba(0,0,0,0.35)', borderRadius: '2px',
      });
    });

    // ===== Printer =====
    const pW = 95, pH = 42, pD = 65;
    const printer = makeCuboid({
      w: pW, h: pH, d: pD,
      x: -120, y: 14 + pH / 2, z: -30,
      colors: PRINTER, radius: 6,
    });
    mk2d(printer.children[0], {
      width: '30px', height: '8px',
      left: (pW / 2 - 15) + 'px', top: '7px',
      background: 'rgba(0,0,0,0.28)', borderRadius: '2px',
    });
    mk2d(printer.children[0], {
      width: '10px', height: '10px', borderRadius: '50%',
      left: '10px', top: (pH / 2 - 13) + 'px',
      background: '#5fd68a', boxShadow: '0 0 6px #5fd68a',
    });
    mk2d(printer.children[0], {
      width: (pW - 24) + 'px', height: '4px',
      left: '12px', top: (pH - 11) + 'px',
      background: 'rgba(0,0,0,0.25)', borderRadius: '2px',
    });
    makeCuboid({ w: 70, h: 9, d: 42, y: -(pH / 2 + 5), colors: PRINTER, radius: 4, parent: printer, nested: true });
    makeCuboid({ w: 56, h: 4, d: 28, y: -(pH / 2 + 7), z: -1, colors: PLATE, parent: printer, nested: true });

    // ===== Router with antennas =====
    const rW = 85, rH = 16, rD = 60;
    const router = makeCuboid({
      w: rW, h: rH, d: rD,
      x: 60, y: 14 + rH / 2, z: 70, ry: 8,
      colors: ROUTER, radius: 6,
    });
    [0, 1, 2, 3].forEach((i) => {
      mk2d(router.children[0], {
        width: '5px', height: '5px', borderRadius: '50%',
        left: (16 + i * 18) + 'px', top: (rH / 2 - 9) + 'px',
        background: i === 0 ? '#5fd68a' : '#e0c364',
        boxShadow: i === 0 ? '0 0 5px #5fd68a' : '0 0 5px #e0c364',
      });
    });
    [-1, 1].forEach((s) => {
      makeCuboid({
        w: 5, h: 30, d: 5,
        x: s * (rW / 2 - 14), y: -(rH / 2 + 15), z: -(rD / 2 - 4),
        rz: s * 16,
        colors: PLATE, parent: router, nested: true,
      });
    });

    // ===== Mouse (small peripheral) =====
    const mouse = makeCuboid({
      w: 30, h: 16, d: 50,
      x: -70, y: 18, z: 80, ry: -10,
      colors: PLATE, radius: 14,
    });
    mk2d(mouse.children[4], {
      width: '2px', height: '18px',
      left: '14px', top: '16px', background: 'rgba(0,0,0,0.3)',
    });

    gsap.set(scene, { rotationX: -16, rotationY: -30, transformPerspective: 1100 });

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
      if (hintRef.current) hintRef.current.textContent = 'Laptop, tower, printer, router and mouse.';
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
            width: 400,
            height: 360,
            perspective: 1100,
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
                width: 280,
                height: 280,
                marginLeft: -140,
                marginTop: -140,
                borderRadius: '50%',
                background: 'radial-gradient(closest-side, rgba(0,0,0,0.45), rgba(0,0,0,0))',
                transform: 'rotateX(90deg) translateZ(-55px)',
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