import type { NextPage } from "next";
import React, { useEffect, useRef, useState, useCallback } from "react";

const Background: NextPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const renderCtx = canvasRef.current.getContext("2d");

      if (renderCtx) {
        console.log(canvasRef.current);
        setContext(renderCtx);
      }
    }
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { devicePixelRatio: ratio = 1 } = window;
      if (context) context.scale(ratio, ratio);

      let w: number;
      let h: number;

      const setCanvasExtents = () => {
        if (canvasRef.current) {
          w = window.innerWidth;
          h = window.innerHeight;
          canvasRef.current.width = w;
          canvasRef.current.height = h;
        }
      };

      setCanvasExtents();

      window.onresize = () => {
        setCanvasExtents();
      };

      const clear = () => {
        if (canvasRef.current && context) {
          context.fillStyle = "black";
          context.fillRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
      };

      const drawStars = () => {
        const makeStars = (
          count: number
        ): { x: number; y: number; z: number }[] => {
          const out = [];
          for (let i = 0; i < count; i++) {
            const s = {
              x: Math.random() * (w * 1.1) - (w * 1.1) / 2,
              y: Math.random() * (h * 1.1) - (h * 1.1) / 2,
              z: Math.random() * 1000,
            };
            out.push(s);
          }
          return out;
        };

        let stars = makeStars(1000);

        const putPixel = (x: number, y: number, brightness: number) => {
          if (context) {
            const intensity = brightness * 255;
            const rgb =
              "rgb(" + intensity + "," + intensity + "," + intensity + ")";
            context.fillStyle = rgb;
            context.fillRect(x, y, 2, 2);
          }
        };

        const moveStars = (distance: number) => {
          const count = stars.length;
          for (var i = 0; i < count; i++) {
            const s = stars[i];
            s.z -= distance;
            if (s.z <= 1) {
              s.z += 1000;
            }
          }
        };

        let prevTime: DOMHighResTimeStamp;
        const init = (time: DOMHighResTimeStamp) => {
          prevTime = time;
          requestAnimationFrame(tick);
        };

        const tick = (time: DOMHighResTimeStamp) => {
          if (canvasRef.current) {
            let elapsed = time - prevTime;
            prevTime = time;

            moveStars(elapsed * 0.04);

            clear();

            const cx = w / 2;
            const cy = h / 2;

            const count = stars.length;
            for (var i = 0; i < count; i++) {
              const star = stars[i];

              const x = cx + star.x / (star.z * 0.001);
              const y = cy + star.y / (star.z * 0.001);

              if (x < 0 || x >= w || y < 0 || y >= h) {
                continue;
              }

              const d = star.z / 1000.0;
              const b = 1 - d * d;

              putPixel(x, y, b);
            }
            requestAnimationFrame(tick);
          }
        };

        requestAnimationFrame(init);
      };

      drawStars();
    },
    [context]
  );

  useEffect(() => {
    if (context) draw(context);
  }, [draw, context]);

  return <canvas className="w-full h-full" ref={canvasRef}></canvas>;
};

export default Background;
