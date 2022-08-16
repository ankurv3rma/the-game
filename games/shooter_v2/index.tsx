import type { NextPage } from "next";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { throttle } from "lodash";
import Background from "./background";
import Modal from "../../components/modal";

type Ship = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  draw: () => void;
  update: () => void;
};

type Bullet = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  source: Ship;
  particleColors: string[];
  timeToLive: number;
  init: () => void;
  draw: () => void;
  update: () => void;
};

type Particle = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  timeToLive: number;
  draw: () => void;
  update: () => void;
};

type Explosion = {
  particleColors: number;
  particles: Particle[];
  source: Bullet;
  init: () => void;
  update: () => void;
};

const { devicePixelRatio: pixelRatio = 1 } = window;
const viewportRatio: number = window.innerWidth / window.innerHeight;
const stageWidth = window.innerWidth;
const stageHeight = window.innerHeight;
const shipWidth = 20;
const shipHeight = 20;
const bulletWidth = viewportRatio > 1 ? 4 : 4;
const bulletHeight = viewportRatio > 1 ? 4 : 4;
const bulletSpeed = viewportRatio > 1 ? 0.01 * stageWidth : 0.01 * stageHeight;
const bulletInterval =
  viewportRatio > 1 ? 0.07 * stageWidth : 0.2 * stageHeight;
const myColor = "#00ceed";
const enemyColor = "#ff4747";

const Game: NextPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  let mouse = useRef<{ x: number; y: number }>({
    x: 0.5,
    y: 0.5,
  });
  const [startModal, setStartModal] = useState<boolean>(true);
  const [started, setStarted] = useState<boolean>(false);
  const gameOver = useRef<boolean>(false);

  let myShip: any = null,
    enemyShip: any = null,
    bullets: any = [],
    explosions: any = [];

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

    const addBullet = () => {
      if (viewportRatio > 1) {
        if (myShip) {
          const maxAngle = Math.atan(myShip.y / stageWidth);
          const minAngle = -Math.atan((stageHeight - myShip.y) / stageWidth);
          const angle = Math.random() * (maxAngle - minAngle) + minAngle;
          bullets.push(
            new (Bullet as any)(
              shipWidth,
              myShip.y,
              bulletSpeed,
              bulletWidth,
              angle,
              "left",
              myColor
            )
          );
        }
        if (enemyShip) {
          const maxAngle = Math.atan(enemyShip.y / stageWidth) + Math.PI / 2;
          const minAngle = Math.atan((stageHeight - enemyShip.y) / stageWidth);

          const angle = Math.random() * (maxAngle - minAngle) + minAngle;
          bullets.push(
            new (Bullet as any)(
              stageWidth - shipWidth,
              enemyShip.y,
              bulletSpeed,
              bulletWidth,
              angle,
              "right",
              enemyColor
            )
          );
        }
      } else {
        if (myShip) {
          const minAngle = Math.atan(stageHeight / (stageWidth - myShip.x));
          const maxAngle = Math.PI / 2 + Math.atan(myShip.x / stageHeight);

          const angle = Math.random() * (maxAngle - minAngle) + minAngle;

          bullets.push(
            new (Bullet as any)(
              myShip.x,
              stageHeight - shipHeight,
              bulletSpeed,
              bulletWidth,
              angle,
              "bottom",
              myColor
            )
          );
        }
        if (enemyShip) {
          const minAngle = Math.atan(stageHeight / (stageWidth - enemyShip.x));
          const maxAngle = Math.PI / 2 + Math.atan(enemyShip.x / stageHeight);
          const angle = Math.random() * (maxAngle - minAngle) + minAngle;
          bullets.push(
            new (Bullet as any)(
              enemyShip.x,
              shipHeight,
              bulletSpeed,
              bulletWidth,
              angle,
              "top",
              enemyColor
            )
          );
        }
      }
    };

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

    const intervalId = setInterval(addBullet, bulletInterval);
    initializeVariables();
    animate();

    return () => {
      document.removeEventListener("mousemove", throttledMouseMove);
      document.removeEventListener("touchmove", throttledTouchMove);
      clearInterval(intervalId);
    };
  }, [context]);

  const startGame = () => {
    setStartModal(false);
    setStarted(true);
  };

  function Ship(
    this: any,
    x: number,
    y: number,
    width: number,
    height: number,
    alignment: "top" | "bottom" | "left" | "right",
    color: string,
    lives: number = 1
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.alignment = alignment;
    this.isDead = false;
    this.lives = lives;
    this.isHit = false;

    this.init = function () {
      if (canvasRef.current) {
        switch (this.alignment) {
          case "top": {
            this.x = x * stageWidth + shipWidth;
            this.y = y * stageHeight + shipHeight;
            break;
          }
          case "bottom": {
            this.x = x * stageWidth + shipWidth;
            this.y = y * stageHeight - shipHeight;
            break;
          }
          case "left": {
            this.x = x * stageWidth + shipWidth;
            this.y = y * stageWidth;
            break;
          }
          case "right": {
            this.x = x * stageWidth - shipWidth;
            this.y = y * stageWidth;
            break;
          }
        }
      }
    };

    this.onHit = function () {
      this.lives -= 1;
      this.isHit = true;
    };

    this.update = function () {
      if (canvasRef.current) {
        switch (this.alignment) {
          case "top": {
            if (mouse.current.x * stageWidth <= this.width) {
              this.x = this.width;
            } else if (mouse.current.x * stageWidth > stageWidth - this.width) {
              this.x = mouse.current.x * stageWidth - this.width;
            } else {
              this.x = mouse.current.x * stageWidth;
            }
            break;
          }
          case "bottom": {
            if (mouse.current.x * stageWidth <= this.width) {
              this.x = this.width;
            } else if (
              mouse.current.x * stageWidth >=
              stageWidth - this.width
            ) {
              this.x = mouse.current.x * stageWidth - this.width;
            } else {
              this.x = mouse.current.x * stageWidth;
            }
            break;
          }
          case "left": {
            if (mouse.current.y * stageHeight <= this.height) {
              this.y = this.height;
            } else if (
              mouse.current.y * stageHeight >
              stageHeight - this.height
            ) {
              this.y = mouse.current.y * stageHeight - this.height;
            } else {
              this.y = mouse.current.y * stageHeight;
            }
            break;
          }
          case "right": {
            if (mouse.current.y * stageHeight <= this.height) {
              this.y = this.height;
            } else if (
              mouse.current.y * stageHeight >
              stageHeight - this.height
            ) {
              this.y = mouse.current.y * stageHeight - this.height;
            } else {
              this.y = mouse.current.y * stageHeight;
            }

            break;
          }
        }
      }

      this.draw();
    };

    this.draw = function () {
      if (context) {
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, this.width, 0, Math.PI * 2, false);
        context.fillStyle = this.color;
        context.shadowColor = this.color;
        context.shadowBlur = this.width;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.fill();
        context.textAlign = "center";
        context.strokeStyle = "#ffffff";
        context.font = "bold 16pt comic sans ms";
        context.fillStyle = "white";
        context.shadowColor = this.color;
        context.shadowBlur = this.width;
        context.fillText(`${this.lives}`, this.x, this.y + 8);
        context.closePath();
        context.restore();
      }
    };

    this.init();
  }

  function Bullet(
    this: any,
    x: number,
    y: number,
    speed: number,
    radius: number,
    angle: number,
    alignment: "top" | "bottom" | "left" | "right",
    color: string
  ) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.angle = angle;
    this.dx = speed;
    this.dy = speed;
    this.alignment = alignment;
    this.isDead = false;

    this.init = function () {
      if (canvasRef.current) {
        switch (this.alignment) {
          case "top": {
            this.dx = speed;
            this.dy = speed;
            break;
          }
          case "bottom": {
            this.dx = -speed;
            this.dy = -speed;
            break;
          }
          case "left": {
            this.dx = speed;
            this.dy = -speed;
            break;
          }
          case "right": {
            this.dx = speed;
            this.dy = speed;
            break;
          }
        }
      }
    };

    this.update = function () {
      if (canvasRef.current) {
        switch (this.alignment) {
          case "top": {
            this.x = this.x + Math.cos(this.angle) * this.dx;
            this.y = this.y + Math.sin(this.angle) * this.dy;

            if (
              this.y >= stageHeight - shipHeight - bulletWidth &&
              this.x >= myShip.x - shipHeight - this.radius &&
              this.x <= myShip.x + shipHeight + this.radius
            ) {
              myShip.onHit();
              this.isDead = true;
            } else if (this.y <= 0) {
              this.isDead = true;
            }
            break;
          }
          case "bottom": {
            this.x = this.x + Math.cos(this.angle) * this.dx;
            this.y = this.y + Math.sin(this.angle) * this.dy;
            if (
              this.y <= shipHeight + bulletWidth &&
              this.x >= myShip.x - shipHeight - this.radius &&
              this.x <= myShip.x + shipHeight + this.radius
            ) {
              enemyShip.onHit();
              this.isDead = true;
            } else if (this.y <= 0) {
              this.isDead = true;
            }
            break;
          }
          case "left": {
            this.x = this.x + Math.cos(this.angle) * this.dx;
            this.y = this.y + Math.sin(this.angle) * this.dy;

            if (
              this.x >= stageWidth - shipWidth - bulletWidth &&
              this.y >= enemyShip.y - shipWidth - this.radius &&
              this.y <= enemyShip.y + shipWidth + this.radius
            ) {
              enemyShip.onHit();
              this.isDead = true;
            } else if (this.x >= stageWidth - bulletWidth) {
              this.isDead = true;
            }
            break;
          }
          case "right": {
            this.x = this.x - Math.cos(this.angle) * this.dx;
            this.y = this.y - Math.sin(this.angle) * this.dy;
            if (
              this.x <= shipWidth + bulletWidth &&
              this.y >= myShip.y - shipWidth - this.radius &&
              this.y <= myShip.y + shipWidth + this.radius
            ) {
              myShip.onHit();
              this.isDead = true;
            } else if (this.x <= 0) {
              this.isDead = true;
            }

            break;
          }
        }
        this.draw();
      }
    };

    this.draw = function () {
      if (context) {
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        context.shadowColor = this.color;
        context.shadowBlur = this.radius * 4;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.fillStyle = this.color;
        context.fill();
        context.closePath();
        context.restore();
      }
    };

    this.init();
  }

  function Particle(
    this: any,
    x: number,
    y: number,
    dx: number,
    dy: number,
    radius: number,
    color: string
  ) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radius = radius;
    this.color = color;
    this.timeToLive = 1;

    this.update = function () {
      if (canvasRef.current) {
        if (
          this.y + this.radius + this.dy > stageHeight * pixelRatio ||
          this.y + this.dy <= 0
        ) {
          this.dy = -this.dy;
        }

        if (
          this.x + this.radius + this.dx > stageWidth * pixelRatio ||
          this.x + this.dx <= 0
        ) {
          this.dx = -this.dx;
        }
        this.x += this.dx;
        this.y += this.dy;
        this.draw();

        this.timeToLive -= 0.06;
      }
    };

    this.draw = function () {
      if (context) {
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        context.shadowColor = this.color;
        context.shadowBlur = 10;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.fillStyle = this.color;
        context.fill();

        context.closePath();

        context.restore();
      }
    };
  }

  function Explosion(
    this: any,
    x: number,
    y: number,
    color: string,
    particleCount: number = 30,
    particleSize: number = 2
  ) {
    this.particles = [];
    this.particleColor = color;
    this.particleCount = particleCount;
    this.particleSize = particleSize;

    this.init = function () {
      for (var i = 0; i < this.particleCount; i++) {
        const dx = Math.random() * 6 - 3;
        const dy = Math.random() * 6 - 3;

        this.particles.push(
          new (Particle as any)(
            x,
            y,
            dx,
            dy,
            this.particleSize,
            this.particleColor
          )
        );
      }
    };

    this.init();

    this.update = function () {
      for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].update();

        if (this.particles[i].timeToLive < 0) {
          this.particles.splice(i, 1);
        }
      }
    };
  }

  function initializeVariables() {
    if (canvasRef.current) {
      if (viewportRatio > 1) {
        myShip = new (Ship as any)(
          0,
          mouse.current.y,
          shipWidth,
          shipHeight,
          "left",
          myColor,
          3
        );
        enemyShip = new (Ship as any)(
          1,
          mouse.current.y,
          shipWidth,
          shipHeight,
          "right",
          enemyColor,
          10
        );
      } else {
        myShip = new (Ship as any)(
          mouse.current.x,
          1,
          shipWidth,
          shipHeight,
          "bottom",
          myColor,
          3
        );
        enemyShip = new (Ship as any)(
          mouse.current.x,
          0,
          shipWidth,
          shipHeight,
          "top",
          enemyColor,
          10
        );
      }

      bullets = [];
      explosions = [];
    }
  }

  const animate = useCallback(() => {
    if (context && canvasRef.current && started && !gameOver.current) {
      window.requestAnimationFrame(animate);
      context.save();
      context.scale(pixelRatio, pixelRatio);
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      if (myShip) {
        if (myShip.lives <= 0) {
          explosions.push(
            new (Explosion as any)(myShip.x, myShip.y, myShip.color, 20, 4)
          );
          myShip = null;
        } else {
          myShip.update();
          if (myShip.isHit) {
            explosions.push(
              new (Explosion as any)(myShip.x, myShip.y, myShip.color, 10, 2)
            );
            myShip.isHit = false;
          }
        }
      }
      if (enemyShip) {
        if (enemyShip.lives <= 0) {
          explosions.push(
            new (Explosion as any)(
              enemyShip.x,
              enemyShip.y,
              enemyShip.color,
              20,
              4
            )
          );
          enemyShip = null;
        } else {
          enemyShip.update();
          if (enemyShip.isHit) {
            explosions.push(
              new (Explosion as any)(
                enemyShip.x,
                enemyShip.y,
                enemyShip.color,
                10,
                2
              )
            );
            enemyShip.isHit = false;
          }
        }
      }

      if (myShip && enemyShip) {
        for (var i = 0; i < bullets.length; i++) {
          bullets[i].update();

          if (bullets[i].isDead) {
            explosions.push(
              new (Explosion as any)(
                bullets[i].x,
                bullets[i].y,
                bullets[i].color,
                20,
                1
              )
            );

            bullets.splice(i, 1);
          }
        }
      }

      for (var j = 0; j < explosions.length; j++) {
        explosions[j].update();
        if (explosions[j].particles.length <= 0) {
          explosions.splice(j, 1);
        }
      }
      context.restore();
    }
  }, []);
  useEffect(() => {
    if (started) {
      animate();
    }
  }, [started, animate]);

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
        <button onClick={startGame}>Start</button>
      </Modal>
    </div>
  );
};

export default Game;
