import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const COVER = {
  top: '#232427',
  front: '#1c1d20',
  back: '#1c1d20',
  right: '#101113',
  left: '#101113',
  bottom: '#0b0c0d',
};

const PAGES = {
  top: '#efe6d3',
  front: '#ddd2ba',
  back: '#ddd2ba',
  right: '#cfc3a8',
  left: '#cfc3a8',
  bottom: '#b8ac92',
};

const BAND = {
  top: '#a83737',
  front: '#8a2b2b',
  back: '#8a2b2b',
  right: '#5e1d1d',
  left: '#5e1d1d',
  bottom: '#5e1d1d',
};

const BARREL = {
  top: '#7c8593',
  front: '#5b6472',
  back: '#5b6472',
  right: '#3f4650',
  left: '#3f4650',
  bottom: '#2c323a',
};

const GOLD = {
  top: '#e6c766',
  front: '#caa227',
  back: '#caa227',
  right: '#9c7d1c',
  left: '#9c7d1c',
  bottom: '#7c631a',
};

export default function StationeryNotebook3D({ compact = false }) {
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const stage = stageRef.current;
    if (!scene || !stage) return;

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
      const {
        w,
        h,
        d,
        x = 0,
        y = 0,
        z = 0,
        rx = 0,
        ry = 0,
        rz = 0,
        colors,
        radius = 0,
        parent = scene,
        nested = false,
      } = opts;

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

      parent.appendChild(el);

      if (nested) {
        gsap.set(el, { x, y, z, rotationX: rx, rotationY: ry, rotationZ: rz });
      } else {
        gsap.set(el, { x, y, z, rotationX: rx, rotationY: ry, rotationZ: rz, scale: 0, opacity: 0 });
        parts.push(el);
      }
      return el;
    }

    // Notebook: pages sandwiched by two thin covers.
    const pagesW = 130, pagesH = 42, pagesD = 190;
    const coverW = 140, coverH = 8, coverD = 200;

    makeCuboid({ w: pagesW, h: pagesH, d: pagesD, colors: PAGES });
    makeCuboid({ w: coverW, h: coverH, d: coverD, y: (pagesH / 2 + coverH / 2), colors: COVER, radius: 2 });
    makeCuboid({ w: coverW, h: coverH, d: coverD, y: -(pagesH / 2 + coverH / 2), colors: COVER, radius: 2 });

    // Elastic band across the front cover.
    makeCuboid({
      w: coverW,
      h: 2,
      d: 10,
      y: -(pagesH / 2 + coverH + 1),
      z: 62,
      colors: BAND,
    });

    // Pen resting diagonally on top, with a gold clip nested at its tip.
    const barrelW = 8, barrelH = 8, barrelD = 150;
    const pen = makeCuboid({
      w: barrelW,
      h: barrelH,
      d: barrelD,
      x: 6,
      y: -(pagesH / 2 + coverH + 8),
      z: -10,
      rx: 5,
      ry: 32,
      colors: BARREL,
      radius: 3,
    });

    makeCuboid({
      w: barrelW - 2,
      h: barrelH - 2,
      d: 16,
      x: 0,
      y: 0,
      z: barrelD / 2 - 6,
      colors: GOLD,
      radius: 2,
      parent: pen,
      nested: true,
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
      if (hintRef.current) hintRef.current.textContent = 'Drag to rotate';
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
            {/* Shadow beneath the notebook */}
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
                transform: 'rotateX(90deg) translateZ(-46px)',
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
