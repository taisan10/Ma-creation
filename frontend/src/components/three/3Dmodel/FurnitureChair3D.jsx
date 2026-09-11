import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const WOOD = {
  top: '#d7b98e',
  front: '#a9714a',
  back: '#8c603d',
  right: '#7c5236',
  left: '#7c5236',
  bottom: '#5c3d26',
};

const CUSHION = {
  top: '#2f6f62',
  front: '#24564c',
  back: '#24564c',
  right: '#1b423a',
  left: '#1b423a',
  bottom: '#1b423a',
};

export default function FurnitureChair3D({ compact = false }) {
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const stage = stageRef.current;
    if (!scene || !stage) return;

    // StrictMode re-mount cleanup
    const parts = [];

    function makeFace(w, h, color, transform) {
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: `${w}px`,
        height: `${h}px`,
        marginLeft: `${-w / 2}px`,
        marginTop: `${-h / 2}px`,
        background: color,
        backfaceVisibility: 'hidden',
        transform,
      });
      return el;
    }

    function makeCuboid(opts) {
      const { w, h, d, x = 0, y = 0, z = 0, colors, radius = 0 } = opts;
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transformStyle: 'preserve-3d',
        borderRadius: radius ? `${radius}px` : '',
      });

      el.appendChild(makeFace(w, h, colors.front, `translateZ(${d / 2}px)`));
      el.appendChild(makeFace(w, h, colors.back, `rotateY(180deg) translateZ(${d / 2}px)`));
      el.appendChild(makeFace(d, h, colors.right, `rotateY(90deg) translateZ(${w / 2}px)`));
      el.appendChild(makeFace(d, h, colors.left, `rotateY(-90deg) translateZ(${w / 2}px)`));
      el.appendChild(makeFace(w, d, colors.top, `rotateX(90deg) translateZ(${h / 2}px)`));
      el.appendChild(makeFace(w, d, colors.bottom, `rotateX(-90deg) translateZ(${h / 2}px)`));

      scene.appendChild(el);
      gsap.set(el, { x, y, z, scale: 0, opacity: 0 });
      parts.push(el);
      return el;
    }

    // Chair Dimensions
    const seatW = 160, seatH = 16, seatD = 140;
    const backW = 160, backH = 108, backD = 14;
    const legW = 14, legH = 110, legD = 14;
    const armW = 14, armH = 60, armD = 120;

    // Cushion
    makeCuboid({ w: seatW, h: seatH, d: seatD, colors: CUSHION, radius: 4 });

    // Backrest
    makeCuboid({
      w: backW, h: backH, d: backD,
      x: 0, y: -(seatH / 2 + backH / 2), z: -(seatD / 2 - backD / 2),
      colors: { ...WOOD, front: CUSHION.front },
      radius: 4,
    });

    // Legs
    const legY = seatH / 2 + legH / 2;
    const legOffsetX = seatW / 2 - 10;
    const legOffsetZ = seatD / 2 - 10;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      makeCuboid({
        w: legW, h: legH, d: legD,
        x: sx * legOffsetX, y: legY, z: sz * legOffsetZ,
        colors: WOOD,
      });
    });

    // Arms
    const armY = -(seatH / 2 + armH / 2) + 30;
    [-1, 1].forEach((sx) => {
      makeCuboid({
        w: armW, h: armH, d: armD,
        x: sx * (seatW / 2 - 4), y: armY, z: -(seatD / 2 - armD / 2) + 10,
        colors: WOOD, radius: 3,
      });
    });

    gsap.set(scene, { rotationX: -18, rotationY: -35, transformPerspective: 950 });

    gsap.to(parts, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      stagger: 0.09,
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
      if (hintRef.current) hintRef.current.textContent = "Drag to rotate";
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
      parts.forEach((p) => p.remove());
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
            width: 340,
            height: 340,
            perspective: 950,
            touchAction: 'none',
            cursor: 'grab',
          }}
        >
          <div
            ref={sceneRef}
            style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
          >
            {/* Shadow beneath the chair */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 220,
                height: 220,
                marginLeft: -110,
                marginTop: -110,
                borderRadius: '50%',
                background: 'radial-gradient(closest-side, rgba(0,0,0,0.45), rgba(0,0,0,0))',
                transform: 'rotateX(90deg) translateZ(-64px)',
              }}
            />
          </div>
        </div>
      </div>
      {!compact && (
        <p ref={hintRef} style={{ fontSize: 13, color: '#8b8f9c', margin: 0, textAlign: 'center', maxWidth: 300 }}>
          Drag to rotate — it’ll keep spinning on its own otherwise.
        </p>
      )}
    </div>
  );
}
