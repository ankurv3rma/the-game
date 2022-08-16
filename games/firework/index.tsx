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

type Cannon = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  color: string;
  draw: () => void;
  update: () => void;
};

type CannonBall = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  source: Cannon;
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
  source: CannonBall;
  init: () => void;
  update: () => void;
};

const Game: NextPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  let timer = useRef<number>(0);
  let isIntroComplete = useRef<boolean>(false);
  let introTimer = useRef<number>(0);

  let mouse = useRef<{ x: number; y: number }>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  let isMouseDown = useRef<boolean>(false);

  let gravity = useRef<number>(0.08);
  let desiredAngle = useRef<number>(0);
  let cannon: any,
    cannonballs: any,
    explosions: any,
    colors: { cannonballColor: string; particleColors: string[] }[];

  useEffect(() => {
    if (canvasRef.current) {
      const renderCtx = canvasRef.current.getContext("2d");

      if (renderCtx) {
        console.log(canvasRef.current);
        setContext(renderCtx);
      }

      canvasRef.current.addEventListener("mousemove", function (event) {
        mouse.current.x = event.clientX;
        mouse.current.y = event.clientY;
      });

      canvasRef.current.addEventListener("mousedown", function () {
        isMouseDown.current = true;
      });

      canvasRef.current.addEventListener("mouseup", function () {
        isMouseDown.current = false;
      });

      canvasRef.current.addEventListener("touchstart", function () {
        isMouseDown.current = true;
      });

      canvasRef.current.addEventListener("touchmove", function (event) {
        event.preventDefault();
        mouse.current.x = event.touches[0].pageX;
        mouse.current.y = event.touches[0].pageY;
      });

      canvasRef.current.addEventListener("touchend", function () {
        isMouseDown.current = false;
      });

      initializeVariables();

      animate();
    }

    return () => {};
  }, [context]);

  function Cannon(
    this: any,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = 0;
    this.color = color;

    this.update = function () {
      desiredAngle.current = Math.atan2(
        mouse.current.y - this.y,
        mouse.current.x - this.x
      );
      this.angle = desiredAngle.current;
      this.draw();
    };

    this.draw = function () {
      if (context) {
        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.angle);
        context.beginPath();
        context.fillStyle = this.color;
        context.shadowColor = this.color;
        context.shadowBlur = 3;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.fillRect(0, -this.height / 2, this.width, height);
        context.closePath();
        context.restore();
      }
    };
  }

  function Cannonball(
    this: any,
    x: number,
    y: number,
    dx: number,
    dy: number,
    radius: number,
    color: string,
    cannon: Cannon,
    particleColors: string[]
  ) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = -dy;
    this.radius = radius;
    this.color = color;
    this.particleColors = particleColors;
    this.source = cannon;
    this.timeToLive =
      canvasRef.current?.height ?? 0 / (canvasRef.current?.height ?? 0 + 800);

    this.init = function () {
      if (canvasRef.current) {
        // Initialize the cannonballs start coordinates (from muzzle of cannon)
        this.x = Math.cos(this.source.angle) * this.source.width;
        this.y = Math.sin(this.source.angle) * this.source.width;

        // Translate relative to canvas positioning
        this.x = this.x + canvasRef.current.width / 2;
        this.y = this.y + canvasRef.current.height;

        // Determine whether the cannonball should be
        // fired to the left or right of the cannon
        if (mouse.current.x - canvasRef.current.width / 2 < 0) {
          this.dx = -this.dx;
        }

        this.dy = Math.sin(this.source.angle) * 8;
        this.dx = Math.cos(this.source.angle) * 8;
      }
    };

    this.update = function () {
      if (canvasRef.current) {
        if (this.y + this.radius + this.dy > canvasRef.current.height) {
          this.dy = -this.dy;
        } else {
          this.dy += gravity.current;
        }

        this.x += this.dx;
        this.y += this.dy;
        this.draw();

        this.timeToLive -= 10;
      }
    };

    this.draw = function () {
      if (context) {
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        context.shadowColor = this.color;
        context.shadowBlur = 5;
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
    this.dy = -dy;
    this.radius = 5;
    this.color = color;
    this.timeToLive = 1;
    // this.mass = 0.2;

    this.update = function () {
      if (canvasRef.current) {
        if (this.y + this.radius + this.dy > canvasRef.current.height) {
          this.dy = -this.dy;
        }

        if (
          this.x + this.radius + this.dx > canvasRef.current.width ||
          this.x - this.radius + this.dx < 0
        ) {
          this.dx = -this.dx;
        }
        // this.dy += gravity.current * this.mass;
        this.x += this.dx;
        this.y += this.dy;
        this.draw();

        this.timeToLive -= 0.01;
      }
    };

    this.draw = function () {
      if (context) {
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, 2, 0, Math.PI * 2, false);
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

  function Explosion(this: any, cannonball: CannonBall) {
    this.particles = [];
    this.source = cannonball;

    this.init = function () {
      for (var i = 0; i < 10; i++) {
        var dx = Math.random() * 6 - 3;
        var dy = Math.random() * 6 - 3;

        // var hue = (255 / 5) * i;
        // var color = "hsl(" + hue + ", 100%, 50%)";
        var randomColorIndex = Math.floor(
          Math.random() * this.source.particleColors.length
        );
        var randomParticleColor = this.source.particleColors[randomColorIndex];

        this.particles.push(
          new (Particle as any)(
            this.source.x,
            this.source.y,
            dx,
            dy,
            1,
            randomParticleColor
          )
        );
      }
    };

    this.init();

    this.update = function () {
      for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].update();

        // Remove particles from scene one time to live is up
        if (this.particles[i].timeToLive < 0) {
          this.particles.splice(i, 1);
        }
      }
    };
  }

  function initializeVariables() {
    if (canvasRef.current) {
      cannon = new (Cannon as any)(
        canvasRef.current.width / 2,
        canvasRef.current.height,
        20,
        10,
        "white"
      );
      cannonballs = [];
      explosions = [];
      colors = [
        // Red / Orange
        {
          cannonballColor: "#fff",
          particleColors: ["#ff4747", "#00ceed", "#fff"],
        },
      ];
    }
  }

  function animate() {
    if (context && canvasRef.current) {
      window.requestAnimationFrame(animate);

      // context.fillStyle = "rgba(18, 18, 18, 0.2)";
      // context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      cannon.update();

      if (isIntroComplete.current === false) {
        introTimer.current += 1;

        if (introTimer.current % 3 === 0) {
          var randomColor = Math.floor(Math.random() * colors.length);
          var color = colors[randomColor];

          cannonballs.push(
            new (Cannonball as any)(
              canvasRef.current.width / 2,
              canvasRef.current.height / 2,
              2,
              2,
              4,
              color.cannonballColor,
              cannon,
              color.particleColors
            )
          );
        }

        if (introTimer.current > 30) {
          isIntroComplete.current = true;
        }
      }

      // Render cannonballs
      for (var i = 0; i < cannonballs.length; i++) {
        cannonballs[i].update();

        if (cannonballs[i].timeToLive <= 0) {
          // Create particle explosion after time to live expires
          explosions.push(new (Explosion as any)(cannonballs[i]));

          cannonballs.splice(i, 1);
        }
      }

      // Render explosions
      for (var j = 0; j < explosions.length; j++) {
        //Do something
        explosions[j].update();

        // Remove explosions from scene once all associated particles are removed
        if (explosions[j].particles.length <= 0) {
          explosions.splice(j, 1);
        }
      }

      if (isMouseDown.current === true) {
        timer.current += 1;
        if (timer.current % 3 === 0) {
          var randomParticleColorIndex = Math.floor(
            Math.random() * colors.length
          );
          var randomColors = colors[randomParticleColorIndex];

          cannonballs.push(
            new (Cannonball as any)(
              mouse.current.x,
              mouse.current.y,
              2,
              2,
              4,
              randomColors.cannonballColor,
              cannon,
              randomColors.particleColors
            )
          );
        }
      }
    }
  }

  // animate();

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
