import type { NextPage } from "next";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { throttle, debounce } from "lodash";
import Background from "./background";

const { devicePixelRatio: pixelRatio = 1 } = window;
const viewportRatio: number = window.innerWidth / window.innerHeight;
const shipWidth = 10 * pixelRatio;
const shipHeight = 10 * pixelRatio;
const bulletWidth = viewportRatio > 1 ? 4 * pixelRatio : 4 * pixelRatio;
const bulletHeight = viewportRatio > 1 ? 4 * pixelRatio : 4 * pixelRatio;

const Game: NextPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  const myPos = useRef<number>(0);

  const enemyPos = useRef<number>(0);

  const bullets = useRef<{ x: number; y: number }[]>([]);

  const enemyBullets = useRef<{ x: number; y: number }[]>([]);

  const addBullet = useCallback(() => {
    if (viewportRatio > 1) {
      bullets.current.push({
        x: shipWidth,
        y:
          myPos.current * window.innerHeight +
          shipHeight / 2 -
          bulletHeight / 2,
      });
      enemyBullets.current.push({
        x: window.innerWidth - shipWidth,
        y:
          enemyPos.current * window.innerHeight +
          shipHeight / 2 -
          bulletHeight / 2,
      });
    } else {
      bullets.current.push({
        x: myPos.current * window.innerWidth + shipWidth / 2 - bulletWidth / 2,
        y: window.innerHeight - shipHeight,
      });
      enemyBullets.current.push({
        x:
          enemyPos.current * window.innerWidth +
          shipWidth / 2 -
          bulletWidth / 2,
        y: window.innerHeight - shipHeight,
      });
    }
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const renderCtx = canvasRef.current.getContext("2d");

      if (renderCtx) {
        console.log(canvasRef.current);
        setContext(renderCtx);
      }
    }
    const setPosition = (pointerPos: MouseEvent | Touch) => {
      let relativePos;
      if (canvasRef.current !== null) {
        if (viewportRatio > 1) {
          relativePos = pointerPos.clientY / canvasRef.current.height;
          if (relativePos > 0 && relativePos < canvasRef.current.height) {
            myPos.current = relativePos;
            enemyPos.current = 1 - relativePos;
          }
        } else {
          relativePos = pointerPos.clientX / canvasRef.current.width;
          if (relativePos > 0 && relativePos < canvasRef.current.width) {
            myPos.current = relativePos;
            enemyPos.current = 1 - relativePos;
          }
        }
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      setPosition(e);
    };

    const throttledMouseMove = throttle(handleMouseMove, 10);

    const handleTouchMove = (e: TouchEvent) => {
      setPosition(e.touches[0]);
    };

    const throttledTouchMove = throttle(handleTouchMove, 10);

    document.addEventListener("mousemove", throttledMouseMove);
    document.addEventListener("touchmove", throttledTouchMove);

    const intervalId = setInterval(addBullet, 200);

    return () => {
      throttledMouseMove.cancel();
      throttledTouchMove.cancel();
      document.removeEventListener("mousemove", throttledMouseMove);
      document.removeEventListener("touchmove", throttledTouchMove);
      clearInterval(intervalId);
    };
  }, [context, addBullet]);

  const clear = useCallback(() => {
    if (canvasRef.current && context) {
      if (viewportRatio > 1) {
        context.clearRect(
          shipWidth,
          0,
          canvasRef.current.width - shipWidth * pixelRatio,
          canvasRef.current.height
        );
      } else {
        context.clearRect(
          0,
          0,
          canvasRef.current.width * pixelRatio,
          canvasRef.current.height - shipHeight
        );
      }
    }
  }, [context]);

  const clearShip = useCallback(
    (isEnemy: boolean = false) => {
      if (canvasRef.current && context) {
        if (isEnemy) {
          if (viewportRatio > 1) {
            context.clearRect(
              window.innerWidth - shipWidth,
              0,
              shipWidth,
              canvasRef.current.height
            );
          } else {
            context.clearRect(0, 0, window.innerWidth, shipHeight);
          }
        } else {
          if (viewportRatio > 1) {
            context.clearRect(0, 0, shipWidth, canvasRef.current.height);
          } else {
            context.clearRect(
              0,
              canvasRef.current.height - shipHeight,
              window.innerWidth,
              shipHeight
            );
          }
        }
      }
    },
    [context]
  );

  const drawShip = useCallback(() => {
    if (context) {
      const tick = () => {
        clearShip();
        context.save();
        context.fillStyle = "blue";
        if (viewportRatio > 1) {
          context.fillRect(
            0,
            window.innerHeight * myPos.current,
            shipWidth,
            shipHeight
          );
        } else {
          context.fillRect(
            window.innerWidth * myPos.current,
            window.innerHeight - shipHeight,
            shipWidth,
            shipHeight
          );
        }

        context.restore();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [context, clearShip]);

  const drawEnemyShip = useCallback(() => {
    if (context) {
      const tick = () => {
        clearShip(true);
        context.save();
        context.fillStyle = "red";
        if (viewportRatio > 1) {
          context.fillRect(
            window.innerWidth - shipWidth,
            window.innerHeight * enemyPos.current,
            shipWidth,
            shipHeight
          );
        } else {
          context.fillRect(
            window.innerWidth * enemyPos.current,
            0,
            shipWidth,
            shipHeight
          );
        }

        context.restore();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [context, clearShip]);

  const drawBullets = useCallback(() => {
    if (context) {
      const paintBullet = (x: number, y: number) => {
        context.save();
        context.fillRect(x, y, bulletWidth, bulletHeight);
        context.restore();
      };

      const moveBullets = (distance: number) => {
        for (let i = 0; i < bullets.current.length; i++) {
          if (viewportRatio > 1) {
            const pos = bullets.current[i].x + distance * window.innerWidth;
            if (pos > window.innerWidth) {
              bullets.current.shift();
            } else {
              bullets.current[i].x = pos;
            }
          } else {
            const pos = bullets.current[i].y - distance * window.innerHeight;
            if (pos < 0) {
              bullets.current.shift();
            } else {
              bullets.current[i].y = pos;
            }
          }
        }
      };

      let prevTime: DOMHighResTimeStamp;
      const init = (time: DOMHighResTimeStamp) => {
        prevTime = time;
        requestAnimationFrame(tick);
      };
      const tick = (time: DOMHighResTimeStamp) => {
        const elapsedTime = time - prevTime;
        prevTime = time;
        clear();
        context.save();
        context.fillStyle = "blue";
        moveBullets(0.003);
        bullets.current.forEach((item) => {
          paintBullet(item.x, item.y);
        });

        context.restore();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(init);
    }
  }, [context, clear]);

  const drawEnemyBullets = useCallback(() => {
    if (context) {
      const paintBullet = (x: number, y: number) => {
        context.save();
        context.fillRect(x, y, bulletWidth, bulletHeight);
        context.restore();
      };

      const moveBullets = (distance: number) => {
        for (let i = 0; i < enemyBullets.current.length; i++) {
          if (viewportRatio > 1) {
            const pos =
              enemyBullets.current[i].x - distance * window.innerWidth;
            if (pos < 0) {
              enemyBullets.current.shift();
            } else {
              enemyBullets.current[i].x = pos;
            }
          } else {
            const pos =
              enemyBullets.current[i].y + distance * window.innerHeight;
            if (pos > window.innerHeight) {
              enemyBullets.current.shift();
            } else {
              enemyBullets.current[i].y = pos;
            }
          }
        }
      };

      let prevTime: DOMHighResTimeStamp;
      const init = (time: DOMHighResTimeStamp) => {
        prevTime = time;
        requestAnimationFrame(tick);
      };
      const tick = (time: DOMHighResTimeStamp) => {
        const elapsedTime = time - prevTime;
        prevTime = time;
        // clear();
        context.save();
        context.fillStyle = "#ff5572";
        moveBullets(0.003);
        enemyBullets.current.forEach((item) => {
          paintBullet(item.x, item.y);
        });

        context.restore();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(init);
    }
  }, [context, clear]);

  useEffect(() => {
    if (canvasRef && canvasRef.current && context) {
      clearShip();
      context.save();
      context.scale(pixelRatio, pixelRatio);
      drawShip();
      drawEnemyShip();
      context.restore();
    }
  }, [context, clearShip, drawShip, drawEnemyShip]);

  useEffect(() => {
    if (canvasRef && canvasRef.current && context) {
      // clear();
      context.save();
      context.scale(pixelRatio, pixelRatio);
      drawBullets();
      drawEnemyBullets();
      context.restore();
    }
  }, [context, drawBullets, drawEnemyBullets]);

  return (
    <div className="relative flex w-full h-screen flex-col items-center justify-center">
      <div className="absolute inset-0">
        <Background />
      </div>
      <canvas
        className="relative"
        width={window.innerWidth}
        height={window.innerHeight}
        ref={canvasRef}
      ></canvas>
    </div>
  );
};

export default Game;
