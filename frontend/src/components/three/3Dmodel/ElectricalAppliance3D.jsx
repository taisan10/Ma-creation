import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const TRXF  = { top: '#7a86a0', front: '#5f6b86', back: '#5f6b86', right: '#46506a', left: '#46506a', bottom: '#2f3650' };
const FIN   = { top: '#6d7892', front: '#526078', back: '#526078', right: '#3a4358', left: '#3a4358', bottom: '#252b3d' };
const POST  = { top: '#c7ccd0', front: '#a9afb4', back: '#a9afb4', right: '#888e93', left: '#888e93', bottom: '#666b70' };
const PNL   = { top: '#f5f3ef', front: '#e8e5de', back: '#e8e5de', right: '#d0ccc2', left: '#d0ccc2', bottom: '#b5b0a4' };
const TOGL  = { top: '#e3685a', front: '#cf4b3c', back: '#cf4b3c', right: '#a23325', left: '#a23325', bottom: '#7a241a' };
const DARK  = { top: '#3a3d43', front: '#2a2c31', back: '#2a2c31', right: '#1e2024', left: '#1e2024', bottom: '#131417' };
const PLUG  = { top: '#f0f0f0', front: '#e0e0e0', back: '#e0e0e0', right: '#bdbdbd', left: '#bdbdbd', bottom: '#959595' };
const PRONG = { top: '#d8dbe0', front: '#c3c7cd', back: '#c3c7cd', right: '#a3a8ae', left: '#a3a8ae', bottom: '#82868c' };
const CRDB  = { top: '#f2f4f5', front: '#e4e7e8', back: '#e4e7e8', right: '#c9cdcf', left: '#c9cdcf', bottom: '#a9adaf' };
const GLSS  = { top: '#fff4cf', front: '#ffecb0', back: '#ffecb0', right: '#f3d98a', left: '#f3d98a', bottom: '#d6b45f' };

export default function ElectricalAppliance3D({ compact = false }) {
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

    // ===== Transformer with cooling fins + terminals =====
    const tW = 80, tH = 60, tD = 70;
    const tx = makeCuboid({ w: tW, h: tH, d: tD, x: -100, y: 15, z: -30, colors: TRXF, radius: 4 });
    [-1, 1].forEach((s) => {
      [-17, 0, 17].forEach((off) => {
        makeCuboid({
          w: 4, h: 12, d: tD - 14,
          x: s * (tW / 2 + 2), y: off,
          colors: FIN, parent: tx, nested: true,
        });
      });
    });
    [-20, 20].forEach((xo) => {
      makeCuboid({ w: 10, h: 10, d: 10, x: xo, y: -(tH / 2 + 4), colors: POST, round: true, parent: tx, nested: true });
    });
    mk2d(tx.children[0], {
      width: '24px', height: '18px',
      left: (tW / 2 - 12) + 'px', top: (tH / 2 - 22) + 'px',
      background: '#ffffff', borderRadius: '2px',
    });
    mk2d(tx.children[0], {
      width: '8px', height: '8px', borderRadius: '50%',
      left: (tW / 2 - 4) + 'px', top: (tH / 2 - 16) + 'px',
      background: '#d64545',
    });

    // ===== Switchgear panel with breaker + toggle =====
    const pW = 58, pH = 88, pD = 12;
    const panel = makeCuboid({
      w: pW, h: pH, d: pD,
      x: 130, y: 3, z: 15, ry: -8,
      colors: PNL, radius: 4,
    });
    [-22, 2].forEach((yoff) => {
      mk2d(panel.children[0], {
        width: (pW - 30) + 'px', height: '4px',
        left: '15px', top: (pH / 2 - 44 + yoff) + 'px',
        background: '#6b6f76', borderRadius: '2px',
      });
    });
    makeCuboid({ w: 10, h: 16, d: 6, x: 0, y: 8, z: pD / 2 + 2, colors: TOGL, radius: 2, parent: panel, nested: true });

    // ===== Plug + cable (wires and cables) =====
    const plug = makeCuboid({
      w: 36, h: 16, d: 14,
      x: 60, y: 37, z: 70, rz: -6,
      colors: PLUG, radius: 3,
    });
    [-10, 10].forEach((xo) => {
      makeCuboid({ w: 5, h: 6, d: 8, x: xo, y: 0, z: 14 / 2 + 6, colors: PRONG, parent: plug, nested: true });
    });
    makeCuboid({ w: 6, h: 6, d: 40, x: 60, y: 37, z: 50, colors: CRDB, radius: 2 });
    makeCuboid({ w: 36, h: 6, d: 6, x: 70, y: 37, z: 30, colors: CRDB, radius: 2 });
    makeCuboid({ w: 6, h: 6, d: 30, x: 87, y: 37, z: 45, colors: CRDB, radius: 2 });

    // ===== Light bulb (component) =====
    makeCuboid({ w: 12, h: 14, d: 12, x: -150, y: 38, z: 85, colors: DARK, radius: 2 });
   
    const glass = makeCuboid({
      w: 20, h: 26, d: 20,
      x: -150, y: 17, z: 85,
      colors: GLSS, round: true, radius: 4,
    });
    mk2d(glass.children[0], {
      width: '8px', height: '14px', left: '6px', top: '3px',
      background: 'radial-gradient(circle at 50% 30%, #fff8dd 0%, #f0c860 65%)',
    });
    mk2d(glass.children[0], {
      width: '2px', height: '16px', left: '9px', top: '4px',
      background: 'rgba(120,90,30,0.7)', borderRadius: '1px',
    });

    gsap.set(scene, { rotationX: -16, rotationY: -32, transformPerspective: 1100 });

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
      if (hintRef.current) hintRef.current.textContent = 'Transformer, breaker panel, plug, cable and light bulb.';
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
                width: 290,
                height: 290,
                marginLeft: -145,
                marginTop: -145,
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