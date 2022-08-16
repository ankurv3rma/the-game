import { MutableRefObject, useRef } from "react";

enum Alignment {
  Top = "TOP",
  Bottom = "BOTTOM",
  Left = "LEFT",
  Right = "RIGHT",
}

export interface BulletInterface {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  alignment: Alignment;
  color: string;
  isDead: boolean;
}

const useBullets = (bounds: {
  top: number;
  bottom: number;
  left: number;
  right: number;
}): [
  MutableRefObject<BulletInterface[]>,
  (initialState: BulletInterface) => void,
  (index: number) => void,
  (index: number) => void,
  (context: CanvasRenderingContext2D, index: number) => void,
  () => void
] => {
  const bullets = useRef<BulletInterface[]>([]);

  const addBullet = (initialState: BulletInterface) => {
    bullets.current.push(initialState);
  };

  const removeBullet = (index: number) => {
    bullets.current.splice(index, 1);
  };

  const update = (index: number) => {
    const newX = bullets.current[index].x + bullets.current[index].dx;
    const newY = bullets.current[index].y + bullets.current[index].dy;
    if (
      newX < bounds.left ||
      newX > bounds.right ||
      newY < bounds.top ||
      newY > bounds.bottom
    ) {
      bullets.current[index].isDead = true;
    } else {
      bullets.current[index].x = newX;
      bullets.current[index].y = newY;
    }
  };

  const reset = () => {
    bullets.current = [];
  };

  const draw = function (context: CanvasRenderingContext2D, index: number) {
    const bullet = bullets.current[index];
    if (context) {
      context.save();
      context.beginPath();
      context.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2, false);
      context.shadowColor = bullet.color;
      context.shadowBlur = bullet.radius * 4;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.fillStyle = bullet.color;
      context.fill();
      context.closePath();
      context.restore();
    }
  };
  return [bullets, addBullet, removeBullet, update, draw, reset];
};

export default useBullets;
