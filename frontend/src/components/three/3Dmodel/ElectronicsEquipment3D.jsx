import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const BEZEL   = { top: '#3a3d43', front: '#2a2c31', back: '#2a2c31', right: '#1e2024', left: '#1e2024', bottom: '#131417' };
const STAND   = { top: '#4a4e55', front: '#3a3d43', back: '#3a3d43', right: '#2a2c31', left: '#2a2c31', bottom: '#1a1c1f' };
const SPEAKER = { top: '#4a4e55', front: '#383c42', back: '#383c42', right: '#292c31', left: '#292c31', bottom: '#1a1c1f' };
const DRIVER  = { top: '#26282c', front: '#1b1d20', back: '#1b1d20', right: '#111214', left: '#111214', bottom: '#0a0a0b' };
const LENS    = { top: '#3f434a', front: '#2c2f34', back: '#2c2f34', right: '#1c1e21', left: '#1c1e21', bottom: '#0f1012' };

export default function ElectronicsEquipment3D({ compact = false }) {
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

    // Flat-screen TV on a small stand
    const tvW = 150, tvH = 88, tvD = 8, tvX = -30, tvZ = -10;
    const neck = makeCuboid({ w: 10, h: 26, d: 10, x: tvX, y: 55, z: tvZ, colors: STAND, radius: 2 });
    makeCuboid({ w: 70, h: 6, d: 30, x: tvX, y: 68, z: tvZ, colors: STAND, radius: 3 });
    const tv = makeCuboid({ w: tvW, h: tvH, d: tvD, x: tvX, y: 55 - 13 - tvH / 2, z: tvZ, colors: BEZEL, radius: 6 });
    mk2d(tv.children[0], {
      width: (tvW - 12) + 'px', height: (tvH - 12) + 'px',
      left: '6px', top: '6px',
      background: 'linear-gradient(150deg, #2a5f8c, #142230)', borderRadius: '2px',
    });

    // Speaker with two round drivers
    const spkW = 52, spkH = 94, spkD = 46, spkX = 110, spkZ = 40;
    const speaker = makeCuboid({
      w: spkW, h: spkH, d: spkD,
      x: spkX, y: 44, z: spkZ, ry: -14,
      colors: SPEAKER, radius: 8,
    });
    [-1, 1].forEach((s) => {
      makeCuboid({
        w: 26, h: 26, d: 6, y: s * 22, z: spkD / 2 + 2,
        colors: DRIVER, round: true, parent: speaker, nested: true,
      });
    });

    // Camera body with a protruding lens
    const camW = 60, camH = 44, camD = 34, camX = -120, camZ = 90;
    const camera = makeCuboid({
      w: camW, h: camH, d: camD,
      x: camX, y: 96, z: camZ, ry: 18,
      colors: BEZEL, radius: 8,
    });
    makeCuboid({
      w: 14, h: 8, d: 10, y: -(camH / 2 + 2), x: -camW / 4,
      colors: STAND, radius: 2, parent: camera, nested: true,
    });
    const lens = makeCuboid({
      w: 32, h: 32, d: 22, z: camD / 2 + 11,
      colors: LENS, round: true, parent: camera, nested: true,
    });
    mk2d(lens.children[0], {
      width: '18px', height: '18px', borderRadius: '50%',
      left: '7px', top: '7px',
      background: 'radial-gradient(circle at 35% 30%, #7fc4ea, #0e2534 70%)',
    });

    gsap.set(scene, { rotationX: -16, rotationY: -30, transformPerspective: 1100 });

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
      if (hintRef.current) hintRef.current.textContent = 'TV, speaker and camera.';
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
            width: 380,
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
                width: 260,
                height: 260,
                marginLeft: -130,
                marginTop: -130,
                borderRadius: '50%',
                background: 'radial-gradient(closest-side, rgba(0,0,0,0.45), rgba(0,0,0,0))',
                transform: 'rotateX(90deg) translateZ(-60px)',
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