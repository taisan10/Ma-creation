// import { useEffect, useRef } from 'react';
// import gsap from 'gsap';

// const BODY  = { top: '#3a7bd5', front: '#2f68b8', back: '#2f68b8', right: '#25549a', left: '#25549a', bottom: '#1a3c72' };
// const CABIN = { top: '#4a89dd', front: '#3a7bd5', back: '#3a7bd5', right: '#2f68b8', left: '#2f68b8', bottom: '#25549a' };
// const TIRE  = { top: '#3a3d42', front: '#2a2c30', back: '#2a2c30', right: '#1e2023', left: '#1e2023', bottom: '#141517' };
// const LIGHT = { top: '#fff6d9', front: '#ffe58a', back: '#ffe58a', right: '#e0c364', left: '#e0c364', bottom: '#b89a48' };

// export default function Automobiles3D({ compact = false }) {
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

//     function mk2d(parent, css) {
//       const d = document.createElement('div');
//       Object.assign(d.style, { position: 'absolute', ...css });
//       parent.appendChild(d);
//     }

//     // Body — length along x, width along z
//     const bodyW = 200, bodyH = 38, bodyD = 90;
//     const body = makeCuboid({ w: bodyW, h: bodyH, d: bodyD, colors: BODY, radius: 10 });

//     // Cabin — nested on body
//     const cabinW = 110, cabinH = 36, cabinD = 78;
//     const cabin = makeCuboid({
//       w: cabinW, h: cabinH, d: cabinD,
//       y: -(bodyH / 2 + cabinH / 2),
//       colors: CABIN, radius: 10, parent: body, nested: true,
//     });
//     // Windshield (front face = children[0])
//     mk2d(cabin.children[0], {
//       width: (cabinW - 16) + 'px', height: '16px',
//       left: '8px', top: '8px',
//       background: 'rgba(20,25,35,0.55)', borderRadius: '4px',
//     });
//     // Window right (children[2])
//     mk2d(cabin.children[2], {
//       width: (cabinD - 16) + 'px', height: '16px',
//       left: '8px', top: '8px',
//       background: 'rgba(20,25,35,0.55)', borderRadius: '4px',
//     });
//     // Window left (children[3])
//     mk2d(cabin.children[3], {
//       width: (cabinD - 16) + 'px', height: '16px',
//       left: '8px', top: '8px',
//       background: 'rgba(20,25,35,0.55)', borderRadius: '4px',
//     });

//     // Headlights — front corners, nested on body
//     [-1, 1].forEach((s) => {
//       makeCuboid({
//         w: 8, h: 10, d: 4,
//         x: bodyW / 2 - 4, y: 2, z: s * (bodyD / 2 - 16),
//         colors: LIGHT, round: true, parent: body, nested: true,
//       });
//     });

//     // Wheels
//     const wheelDia = 46, wheelThick = 16;
//     const wheelY = bodyH / 2 + wheelDia / 2 - 10;
//     [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
//       const wheel = makeCuboid({
//         w: wheelDia, h: wheelDia, d: wheelThick,
//         x: sx * (bodyW / 2 - 34), y: wheelY, z: sz * (bodyD / 2 + 2),
//         colors: TIRE, round: true,
//       });
//       // Hub cap on face facing outward
//       mk2d(wheel.children[sz < 0 ? 1 : 0], {
//         width: '16px', height: '16px', borderRadius: '50%',
//         left: (wheelDia / 2 - 8) + 'px', top: (wheelDia / 2 - 8) + 'px',
//         background: '#b7bcc2',
//       });
//     });

//     gsap.set(scene, { rotationX: -16, rotationY: -32, transformPerspective: 1100 });

//     gsap.to(parts, {
//       opacity: 1,
//       scale: 1,
//       duration: 0.7,
//       stagger: 0.07,
//       ease: 'back.out(1.6)',
//       delay: 0.2,
//     });

//     const idle = gsap.to(scene, {
//       rotationY: '+=360',
//       duration: 16,
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
//       if (hintRef.current) hintRef.current.textContent = 'Body, cabin, headlights and four wheels.';
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
//             width: 400,
//             height: 340,
//             perspective: 1100,
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
//                 width: 280,
//                 height: 280,
//                 marginLeft: -140,
//                 marginTop: -140,
//                 borderRadius: '50%',
//                 background: 'radial-gradient(closest-side, rgba(0,0,0,0.5), rgba(0,0,0,0))',
//                 transform: 'rotateX(90deg) translateZ(-45px)',
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

const BODY  = { top: '#3a7bd5', front: '#2f68b8', back: '#2f68b8', right: '#25549a', left: '#25549a', bottom: '#1a3c72' };
const CABIN = { top: '#4a89dd', front: '#3a7bd5', back: '#3a7bd5', right: '#2f68b8', left: '#2f68b8', bottom: '#25549a' };
const TIRE  = { top: '#3a3d42', front: '#2a2c30', back: '#2a2c30', right: '#1e2023', left: '#1e2023', bottom: '#141517' };
const LIGHT = { top: '#fff6d9', front: '#ffe58a', back: '#ffe58a', right: '#e0c364', left: '#e0c364', bottom: '#b89a48' };
const BATT  = { top: '#4a4e55', front: '#3a3d43', back: '#3a3d43', right: '#2a2c31', left: '#2a2c31', bottom: '#1a1c1f' };
const POS   = { top: '#e3685a', front: '#cf4b3c', back: '#cf4b3c', right: '#a23325', left: '#a23325', bottom: '#7a241a' };
const NEG   = { top: '#2e3136', front: '#222428', back: '#222428', right: '#17181b', left: '#17181b', bottom: '#0c0d0e' };
const TOOL  = { top: '#b04040', front: '#963333', back: '#963333', right: '#6e2323', left: '#6e2323', bottom: '#4c1717' };
const PAD   = { top: '#d8dbe0', front: '#c3c7cd', back: '#c3c7cd', right: '#a3a8ae', left: '#a3a8ae', bottom: '#82868c' };

export default function Automobiles3D({ compact = false }) {
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

    // ===== Car =====
    const bodyW = 200, bodyH = 38, bodyD = 90;
    const body = makeCuboid({ w: bodyW, h: bodyH, d: bodyD, colors: BODY, radius: 10 });

    const cabinW = 110, cabinH = 36, cabinD = 78;
    const cabin = makeCuboid({
      w: cabinW, h: cabinH, d: cabinD,
      y: -(bodyH / 2 + cabinH / 2),
      colors: CABIN, radius: 10, parent: body, nested: true,
    });
    mk2d(cabin.children[0], {
      width: (cabinW - 16) + 'px', height: '16px',
      left: '8px', top: '8px',
      background: 'rgba(20,25,35,0.55)', borderRadius: '4px',
    });
    mk2d(cabin.children[2], {
      width: (cabinD - 16) + 'px', height: '16px',
      left: '8px', top: '8px',
      background: 'rgba(20,25,35,0.55)', borderRadius: '4px',
    });
    mk2d(cabin.children[3], {
      width: (cabinD - 16) + 'px', height: '16px',
      left: '8px', top: '8px',
      background: 'rgba(20,25,35,0.55)', borderRadius: '4px',
    });

    [-1, 1].forEach((s) => {
      makeCuboid({
        w: 8, h: 10, d: 4,
        x: bodyW / 2 - 4, y: 2, z: s * (bodyD / 2 - 16),
        colors: LIGHT, round: true, parent: body, nested: true,
      });
    });

    const wheelDia = 46, wheelThick = 16;
    const wheelY = bodyH / 2 + wheelDia / 2 - 10;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const wheel = makeCuboid({
        w: wheelDia, h: wheelDia, d: wheelThick,
        x: sx * (bodyW / 2 - 34), y: wheelY, z: sz * (bodyD / 2 + 2),
        colors: TIRE, round: true,
      });
      mk2d(wheel.children[sz < 0 ? 1 : 0], {
        width: '16px', height: '16px', borderRadius: '50%',
        left: (wheelDia / 2 - 8) + 'px', top: (wheelDia / 2 - 8) + 'px',
        background: '#b7bcc2',
      });
    });

    // ===== Spare tyre (tilted, oxonee side) =====
    const spare = makeCuboid({
      w: 44, h: 44, d: 18,
      x: -155, y: 33, z: -15, rz: 12,
      colors: TIRE, round: true,
    });
    mk2d(spare.children[0], {
      width: '16px', height: '16px', borderRadius: '50%',
      left: (44 / 2 - 8) + 'px', top: (44 / 2 - 8) + 'px',
      background: '#b7bcc2',
    });

    // ===== Battery with terminals =====
    const battery = makeCuboid({
      w: 48, h: 26, d: 36,
      x: 135, y: 42, z: 20,
      colors: BATT, radius: 5,
    });
    mk2d(battery.children[0], {
      width: '22px', height: '14px',
      left: (48 / 2 - 11) + 'px', top: (26 / 2 - 8) + 'px',
      background: 'rgba(255,255,255,0.85)', borderRadius: '2px',
    });
    makeCuboid({ w: 9, h: 9, d: 9, x: -11, y: -19, colors: POS, round: true, parent: battery, nested: true });
    makeCuboid({ w: 9, h: 9, d: 9, x: 11, y: -19, colors: NEG, round: true, parent: battery, nested: true });

    // ===== Toolbox with handle =====
    const toolbox = makeCuboid({
      w: 58, h: 24, d: 38,
      x: -130, y: 43, z: 95,
      colors: TOOL, radius: 6,
    });
    mk2d(toolbox.children[0], {
      width: '12px', height: '6px', left: '6px', top: '8px',
      background: 'rgba(0,0,0,0.4)', borderRadius: '2px',
    });
    mk2d(toolbox.children[0], {
      width: '12px', height: '6px', left: (58 - 18) + 'px', top: '8px',
      background: 'rgba(0,0,0,0.4)', borderRadius: '2px',
    });
    mk2d(toolbox.children[0], {
      width: '5px', height: '5px', borderRadius: '50%',
      left: (58 / 2 - 2) + 'px', top: (24 / 2 - 8) + 'px',
      background: '#e0c364',
    });
    makeCuboid({ w: 26, h: 4, d: 4, y: -15, colors: PAD, parent: toolbox, nested: true });

    gsap.set(scene, { rotationX: -16, rotationY: -32, transformPerspective: 1150 });

    gsap.to(parts, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      stagger: 0.07,
      ease: 'back.out(1.6)',
      delay: 0.2,
    });

    const idle = gsap.to(scene, {
      rotationY: '+=360',
      duration: 16,
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
      if (hintRef.current) hintRef.current.textContent = 'Car, spare tyre, battery and toolbox.';
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
          transform: compact ? 'scale(0.45)' : 'scale(1)',
          transformOrigin: 'center center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          ref={stageRef}
          style={{
            width: 420,
            height: 380,
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
                background: 'radial-gradient(closest-side, rgba(0,0,0,0.5), rgba(0,0,0,0))',
                transform: 'rotateX(90deg) translateZ(-50px)',
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