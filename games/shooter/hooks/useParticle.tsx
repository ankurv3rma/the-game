import { MutableRefObject, useRef } from "react";

export interface ParticleInterface {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  timeToLive: number;
}

const useParticles = (bounds: {
  top: number;
  bottom: number;
  left: number;
  right: number;
}): [
  MutableRefObject<ParticleInterface[]>,
  (initialState: ParticleInterface) => void,
  (index: number) => void,
  (index: number) => void,
  (context: CanvasRenderingContext2D, index: number) => void
] => {
  const particles = useRef<ParticleInterface[]>([]);

  const addParticle = (initialState: ParticleInterface) => {
    particles.current.push(initialState);
  };

  const removeParticle = (index: number) => {
    particles.current.splice(index, 1);
  };

  const update = (index: number) => {
    particles.current[index].x =
      particles.current[index].x + particles.current[index].dx;
    particles.current[index].y =
      particles.current[index].y + particles.current[index].dy;
  };

  const draw = function (context: CanvasRenderingContext2D, index: number) {
    const particle = particles.current[index];
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
  return [particles, addParticle, removeParticle, update, draw];
};

export default useParticles;
