import { MutableRefObject, useRef } from "react";

export interface ExplosionInterface {
  x: number;
  y: number;
  color: string;
  particleCount: number;
  particleSize: number;
  particles: ParticleInterface[];
}

export interface ParticleInterface {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  timeToLive: number;
}

const useExplosions = (bounds: {
  top: number;
  bottom: number;
  left: number;
  right: number;
}): [
  MutableRefObject<ExplosionInterface[]>,
  (initialState: Omit<ExplosionInterface, "particles">) => void,
  (index: number) => void,
  (context: CanvasRenderingContext2D, index: number) => void
] => {
  const explosions = useRef<ExplosionInterface[]>([]);

  const addExplosion = ({
    x,
    y,
    color,
    particleCount = 20,
    particleSize = 2,
  }: Omit<ExplosionInterface, "particles">) => {
    const particles: ParticleInterface[] = [];
    for (let i = 0; i < particleCount; i++) {
      const dx = Math.random() * 6 - 3;
      const dy = Math.random() * 6 - 3;
      particles.push({
        x,
        y,
        dx,
        dy,
        radius: particleSize,
        color,
        timeToLive: 1,
      });
    }
    explosions.current.push({
      x,
      y,
      color,
      particleCount,
      particleSize,
      particles: particles,
    });
  };

  const removeExplosion = (index: number) => {
    explosions.current.splice(index, 1);
  };

  const updateAndDraw = (context: CanvasRenderingContext2D, index: number) => {
    const explosion = explosions.current[index];
    for (let i = 0; i < explosion.particles.length; i++) {
      const particle = explosion.particles[i];
      if (
        particle.y + particle.radius + particle.dy > bounds.bottom ||
        particle.y + particle.dy <= bounds.top
      ) {
        particle.dy = -particle.dy;
      }

      if (
        particle.x + particle.dx > bounds.right ||
        particle.x + particle.dx <= bounds.left
      ) {
        particle.dx = -particle.dx;
      }
      particle.x += particle.dx;
      particle.y += particle.dy;
      drawParticle(context, index, i);

      particle.timeToLive -= 0.06;
      if (explosion.particles[i].timeToLive < 0) {
        explosion.particles.splice(i, 1);
      }
    }
  };

  const drawParticle = (
    context: CanvasRenderingContext2D,
    explosionIndex: number,
    particleIndex: number
  ) => {
    const particle =
      explosions.current[explosionIndex].particles[particleIndex];
    if (context) {
      context.save();
      context.beginPath();
      context.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2,
        false
      );
      context.shadowColor = particle.color;
      context.shadowBlur = 10;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.fillStyle = particle.color;
      context.fill();
      context.closePath();
      context.restore();
    }
  };

  return [explosions, addExplosion, removeExplosion, updateAndDraw];
};

export default useExplosions;
