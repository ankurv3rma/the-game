import type { NextPage } from "next";
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { GiHorizontalFlip, GiVerticalFlip } from "react-icons/gi";
import { throttle, clamp, random } from "lodash";
import Background from "./background";
import Modal from "../../components/modal";
import useShip, { ShipInterface } from "./hooks/useShip";
import useBullets, { BulletInterface } from "./hooks/useBullets";
import useExplosions from "./hooks/useExplosion";
import { motion, useMotionValue } from "framer-motion";
import { useRouter } from "next/router";

const { devicePixelRatio: pixelRatio = 1 } = window;
const viewportRatio: number = window.innerWidth / window.innerHeight;
const stageWidth = window.innerWidth;
const stageHeight = window.innerHeight;
const shipWidth = 20;
const shipHeight = 20;
const bulletWidth = viewportRatio > 1 ? 6 : 6;
const bulletHeight = viewportRatio > 1 ? 6 : 6;
const bulletSpeed =
  viewportRatio > 1
    ? 0.002 * stageWidth * viewportRatio
    : 0.008 * stageHeight * viewportRatio;
const bulletInterval =
  viewportRatio > 1 ? 0.15 * stageWidth : 0.55 * stageHeight;
const myColor = "#00ceed";
const enemyColor = "#ff4747";

enum Alignment {
  Top = "TOP",
  Bottom = "BOTTOM",
  Left = "LEFT",
  Right = "RIGHT",
}

const SHIP_BOUNDS = {
  top: shipHeight,
  bottom: stageHeight - shipHeight,
  left: shipWidth,
  right: stageWidth - shipWidth,
};

const BULLET_BOUNDS = {
  top: bulletHeight,
  bottom: stageHeight - bulletHeight,
  left: bulletWidth,
  right: stageWidth - bulletWidth,
};

const STAGE_BOUNDS = {
  top: 0,
  bottom: stageHeight,
  left: 0,
  right: stageWidth,
};

const Game: NextPage = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [bulletIntervalId, setBulletIntervalId] = useState<number | null>(null);

  const motionVal = useMotionValue(10);

  let mouse = useRef<{ x: number; y: number }>({
    x: 0.5,
    y: 0.5,
  });
  const [startModal, setStartModal] = useState<boolean>(true);
  const [endModal, setEndModal] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);
  const gameOver = useRef<boolean>(false);
  const [result, setResult] = useState<"won" | "lost" | null>(null);

  const [myShip, myShipUpdate, myShipDraw, myShipReset] = useShip({
    x: viewportRatio > 1 ? shipWidth : mouse.current.x * stageWidth,
    y:
      viewportRatio > 1
        ? mouse.current.y * stageHeight
        : stageHeight - shipHeight,
    width: shipWidth,
    height: shipHeight,
    alignment: viewportRatio > 1 ? Alignment.Left : Alignment.Bottom,
    color: myColor,
    lives: 3,
    isDead: false,
    isHit: false,
    bounds: SHIP_BOUNDS,
  });
  const [enemyShip, enemyShipUpdate, enemyShipDraw, enemyShipReset] = useShip({
    x:
      viewportRatio > 1 ? stageWidth - shipWidth : mouse.current.x * stageWidth,
    y: viewportRatio > 1 ? mouse.current.y * stageHeight : shipHeight,
    width: shipWidth,
    height: shipHeight,
    alignment: viewportRatio > 1 ? Alignment.Right : Alignment.Top,
    color: enemyColor,
    lives: 10,
    isDead: false,
    isHit: false,
    bounds: SHIP_BOUNDS,
  });
  const [
    bullets,
    insertBullet,
    removeBullet,
    updateBullet,
    drawBullet,
    resetBullets,
  ] = useBullets(BULLET_BOUNDS);

  const [explosions, addExplosion, removeExplosion, updateExplosion] =
    useExplosions(STAGE_BOUNDS);

  const checkCollision = useCallback(
    (bullet: BulletInterface) => {
      let collision = false;
      // let collisionBounds;
      const targetShip = [Alignment.Left, Alignment.Bottom].includes(
        bullet.alignment
      )
        ? enemyShip
        : myShip;
      let collisionBounds = {
        top: targetShip.current.y - targetShip.current.height - bullet.radius,
        bottom:
          targetShip.current.y + targetShip.current.height + bullet.radius,
        left: targetShip.current.x - targetShip.current.width - bullet.radius,
        right: targetShip.current.x + targetShip.current.width + bullet.radius,
      };
      switch (bullet.alignment) {
        case Alignment.Top:
          if (
            bullet.y >= collisionBounds.top &&
            bullet.x >= collisionBounds.left &&
            bullet.x <= collisionBounds.right
          ) {
            collision = true;
            myShipUpdate({
              lives: myShip.current.lives - 1,
            } as ShipInterface);
          }
          break;
        case Alignment.Bottom:
          if (
            bullet.y <= collisionBounds.bottom &&
            bullet.x >= collisionBounds.left &&
            bullet.x <= collisionBounds.right
          ) {
            collision = true;
            enemyShipUpdate({
              lives: enemyShip.current.lives - 1,
            } as ShipInterface);
          }
          break;
        case Alignment.Left:
          if (
            bullet.x >= collisionBounds.left &&
            bullet.y >= collisionBounds.top &&
            bullet.y <= collisionBounds.bottom
          ) {
            collision = true;
            enemyShipUpdate({
              lives: enemyShip.current.lives - 1,
            } as ShipInterface);
          }
          break;
        case Alignment.Right:
          if (
            bullet.x <= collisionBounds.right &&
            bullet.y >= collisionBounds.top &&
            bullet.y <= collisionBounds.bottom
          ) {
            collision = true;
            myShipUpdate({
              lives: myShip.current.lives - 1,
            } as ShipInterface);
          }
          break;
      }
      return collision;
    },
    [enemyShip, enemyShipUpdate, myShip, myShipUpdate]
  );

  const animate = useCallback(() => {
    if (context && canvasRef.current && started && !gameOver.current) {
      if (myShip.current.lives === -1 && explosions.current.length === 0) {
        endGame("lost");
      } else if (
        enemyShip.current.lives === -1 &&
        explosions.current.length === 0
      ) {
        endGame("won");
      }
      window.requestAnimationFrame(animate);
      context.save();
      context.scale(pixelRatio, pixelRatio);
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      if (myShip.current.lives === 0) {
        addExplosion({
          x: myShip.current.x,
          y: myShip.current.y,
          color: myShip.current.color,
          particleCount: 20,
          particleSize: 4,
        });
        myShipUpdate({ lives: -1 } as ShipInterface);
      } else if (myShip.current.lives !== -1) {
        myShipUpdate({
          x:
            viewportRatio > 1
              ? myShip.current.x
              : clamp(
                  mouse.current.x * stageWidth,
                  SHIP_BOUNDS.left,
                  SHIP_BOUNDS.right
                ),
          y:
            viewportRatio > 1
              ? clamp(
                  mouse.current.y * stageHeight,
                  SHIP_BOUNDS.top,
                  SHIP_BOUNDS.bottom
                )
              : myShip.current.y,
        } as ShipInterface);

        myShipDraw(context);

        if (myShip.current.isHit) {
          addExplosion({
            x: myShip.current.x,
            y: myShip.current.y,
            color: myShip.current.color,
            particleCount: 10,
            particleSize: 2,
          });
          myShip.current.isHit = false;
        }
      }

      if (enemyShip.current.lives === 0) {
        addExplosion({
          x: enemyShip.current.x,
          y: enemyShip.current.y,
          color: enemyShip.current.color,
          particleCount: 20,
          particleSize: 4,
        });
        enemyShipUpdate({ lives: -1 } as ShipInterface);
      } else if (enemyShip.current.lives !== -1) {
        enemyShipUpdate({
          x:
            viewportRatio > 1
              ? enemyShip.current.x
              : clamp(
                  mouse.current.x * stageWidth,
                  SHIP_BOUNDS.left,
                  SHIP_BOUNDS.right
                ),
          y:
            viewportRatio > 1
              ? clamp(
                  mouse.current.y * stageHeight,
                  SHIP_BOUNDS.top,
                  SHIP_BOUNDS.bottom
                )
              : enemyShip.current.y,
        } as ShipInterface);

        enemyShipDraw(context);

        if (enemyShip.current.isHit) {
          addExplosion({
            x: enemyShip.current.x,
            y: enemyShip.current.y,
            color: enemyShip.current.color,
            particleCount: 10,
            particleSize: 2,
          });
          enemyShip.current.isHit = false;
        }
      }

      if (myShip.current.lives > 0 && enemyShip.current.lives > 0) {
        for (let i = 0; i < bullets.current.length; i++) {
          updateBullet(i);
          drawBullet(context, i);

          if (bullets.current[i].isDead || checkCollision(bullets.current[i])) {
            addExplosion({
              x: bullets.current[i].x,
              y: bullets.current[i].y,
              color: bullets.current[i].color,
              particleCount: 20,
              particleSize: 1,
            });

            removeBullet(i);
          }
        }
      }

      for (var j = 0; j < explosions.current.length; j++) {
        updateExplosion(context, j);
        if (explosions.current[j].particles.length <= 0) {
          removeExplosion(j);
        }
      }
      context.restore();
    }
  }, [
    addExplosion,
    bullets,
    checkCollision,
    context,
    drawBullet,
    enemyShip,
    enemyShipDraw,
    enemyShipUpdate,
    explosions,
    myShip,
    myShipDraw,
    myShipUpdate,
    removeBullet,
    removeExplosion,
    started,
    updateBullet,
    updateExplosion,
  ]);

  useEffect(() => {
    if (canvasRef.current) {
      const renderCtx = canvasRef.current.getContext("2d");

      if (renderCtx) {
        console.log(canvasRef.current);
        setContext(renderCtx);
      }
      canvasRef.current.width = stageWidth * pixelRatio;
      canvasRef.current.height = stageHeight * pixelRatio;
    }

    const setPosition = (pointerPos: MouseEvent | Touch) => {
      if (canvasRef.current !== null) {
        mouse.current.y = pointerPos.clientY / stageHeight;
        mouse.current.x = pointerPos.clientX / stageWidth;
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

    // const intervalId = setInterval(addBullet, bulletInterval);
    // initializeVariables();
    // animate();

    return () => {
      document.removeEventListener("mousemove", throttledMouseMove);
      document.removeEventListener("touchmove", throttledTouchMove);
      // clearInterval(intervalId);
    };
  }, [animate, context, enemyShip, insertBullet, myShip]);

  const startGame = () => {
    setStartModal(false);
    setEndModal(false);
    setStarted(true);
    myShipReset();
    enemyShipReset();
    resetBullets();
    gameOver.current = false;
  };

  const endGame = (result: "won" | "lost") => {
    setEndModal(true);
    setStarted(false);
    setResult(result);
    gameOver.current = true;
  };

  const exitGame = () => {
    router.replace("/");
  };

  useEffect(() => {
    // const maxAngle = Math.atan(myShip.current.y / stageWidth);
    // const minAngle = -Math.atan((stageHeight - myShip.current.y) / stageWidth);
    // const angle = Math.random() * (maxAngle - minAngle) + minAngle;
    const addBullet = () => {
      if (!myShip.current.isDead) {
        const maxAngle =
          viewportRatio > 1
            ? Math.atan(myShip.current.y / stageWidth)
            : Math.atan(myShip.current.x / stageHeight);
        const minAngle =
          viewportRatio > 1
            ? Math.atan(-(stageHeight - myShip.current.y) / stageWidth)
            : Math.atan(-(stageWidth - myShip.current.x) / stageHeight);
        const angle = random(minAngle, maxAngle, true);
        insertBullet({
          x: myShip.current.x,
          y: myShip.current.y,
          dx:
            viewportRatio > 1
              ? Math.cos(angle) * bulletSpeed
              : Math.sin(angle) * -bulletSpeed,
          dy:
            viewportRatio > 1
              ? Math.sin(angle) * -bulletSpeed
              : Math.cos(angle) * -bulletSpeed,
          radius: bulletWidth,
          alignment: viewportRatio > 1 ? Alignment.Left : Alignment.Bottom,
          color: myColor,
          isDead: false,
        });
      }
      if (!enemyShip.current.isDead) {
        const maxAngle =
          viewportRatio > 1
            ? Math.atan(myShip.current.y / stageWidth)
            : Math.atan(myShip.current.x / stageHeight);
        const minAngle =
          viewportRatio > 1
            ? Math.atan(-(stageHeight - myShip.current.y) / stageWidth)
            : Math.atan(-(stageWidth - myShip.current.x) / stageHeight);
        const angle = random(minAngle, maxAngle, true);
        insertBullet({
          x: enemyShip.current.x,
          y: enemyShip.current.y,
          dx:
            viewportRatio > 1
              ? Math.cos(angle) * -bulletSpeed
              : Math.sin(angle) * -bulletSpeed,
          dy:
            viewportRatio > 1
              ? Math.sin(angle) * -bulletSpeed
              : Math.cos(angle) * bulletSpeed,
          radius: bulletWidth,
          alignment: viewportRatio > 1 ? Alignment.Right : Alignment.Top,
          color: enemyColor,
          isDead: false,
        });
      }
    };
    if (gameOver.current) {
      if (bulletIntervalId) window.clearInterval(bulletIntervalId);
      setBulletIntervalId(null);
    }
    if (started && !gameOver.current) {
      animate();
      if (!bulletIntervalId) {
        const intervalId = window.setInterval(addBullet, bulletInterval);
        setBulletIntervalId(intervalId);
      }
    }
  }, [started, animate, myShip, enemyShip, insertBullet, bulletIntervalId]);

  return (
    <div className="relative flex w-full h-screen flex-col items-center justify-center">
      <div className="absolute inset-0">
        <Background />
      </div>
      <canvas
        className="relative w-full h-full"
        width={stageWidth}
        height={stageHeight}
        ref={canvasRef}
      ></canvas>
      <Modal
        open={startModal}
        onClose={() => {
          setStartModal(false);
        }}
      >
        <div className="w-full h-full text-center px-6 py-8">
          <div className="">
            <div className="flex flex-col items-center mb-8">
              <h3 className="text-2xl text-center text-white">
                Move mouse/swipe to move
              </h3>
              <motion.div
                initial={{ x: "-150%" }}
                animate={{ x: "150%" }}
                transition={{
                  repeat: Infinity,
                  repeatType: "mirror",
                  duration: 0.8,
                }}
                className="flex flex-col items-center"
              >
                <GiHorizontalFlip className="text-3xl" />
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center" />
              </motion.div>
            </div>
            <div className="flex flex-col items-center mb-8">
              <h3 className="text-2xl text-center text-white mb-6">
                Destroy the enemy
              </h3>
              {/* <motion.div
                initial={{ x: "-150%" }}
                animate={{ x: "150%" }}
                transition={{
                  repeat: Infinity,
                  repeatType: "mirror",
                  duration: 0.8,
                }}
                className="flex flex-col items-center"
              ></motion.div> */}
              <motion.div
                // initial={{ scale: 1, opacity: 1 }}
                animate={{
                  scale: [1, 1.5, 2, 1.5, 1],
                  opacity: [1, 1, 0, 0, 1],
                }}
                transition={{
                  ease: "linear",
                  repeat: Infinity,
                  // repeatType: "mirror",

                  repeatDelay: 1,
                  duration: 1,
                  times: [0, 0.2, 0.4, 0.8, 1],
                  delay: 1,
                }}
                layout
                className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"
              ></motion.div>
            </div>
          </div>
          <button
            className="bg-blue-400 text-white px-6 py-3"
            onClick={startGame}
          >
            Start
          </button>
        </div>
      </Modal>
      <Modal
        open={endModal}
        onClose={() => {
          setEndModal(false);
        }}
      >
        <div className="w-full h-full text-center px-6 py-8">
          <div className="flex flex-col items-center mb-12">
            <div
              className={`w-16 h-16 rounded-full mb-8 ${
                result === "won" ? "bg-blue-500" : "bg-red-500"
              }`}
            ></div>
            <h2
              className={`${
                result === "won" ? "text-blue-500" : "text-red-500"
              } text-3xl font-bold uppercase mb-12`}
            >
              You {result}
            </h2>
            <button
              className="bg-blue-500 text-white px-6 py-3 mb-4"
              onClick={startGame}
            >
              Play Again
            </button>
            <button
              className="bg-blue-500 text-white px-6 py-3"
              onClick={exitGame}
            >
              Exit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Game;
