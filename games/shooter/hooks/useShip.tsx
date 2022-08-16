import { MutableRefObject, useRef } from "react";

export enum ShipActionType {
  MOVE = "MOVE",
  HIT = "HIT",
  DESTROY = "DESTROY",
}

enum Alignment {
  Top = "TOP",
  Bottom = "BOTTOM",
  Left = "LEFT",
  Right = "RIGHT",
}

export interface ShipInterface {
  x: number;
  y: number;
  width: number;
  height: number;
  alignment: Alignment;
  color: string;
  lives: number;
  isDead: boolean;
  isHit: boolean;
  bounds: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

const useShip = (
  initialState: ShipInterface
): [
  MutableRefObject<ShipInterface>,
  (values: ShipInterface) => void,
  (context: CanvasRenderingContext2D) => void,
  () => void
] => {
  const shipState = useRef(initialState);

  const update = (values: ShipInterface) => {
    shipState.current = { ...shipState.current, ...values };
  };

  const reset = () => {
    shipState.current = initialState;
  };

  const draw = function (context: CanvasRenderingContext2D) {
    if (context) {
      context.save();
      context.beginPath();
      context.arc(
        shipState.current.x,
        shipState.current.y,
        shipState.current.width,
        0,
        Math.PI * 2,
        false
      );
      context.fillStyle = shipState.current.color;
      context.shadowColor = shipState.current.color;
      context.shadowBlur = shipState.current.width;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.fill();
      context.textAlign = "center";
      context.strokeStyle = "#ffffff";
      context.font = "bold 16pt comic sans ms";
      context.fillStyle = "white";
      context.shadowColor = shipState.current.color;
      context.shadowBlur = shipState.current.width;
      context.fillText(
        `${shipState.current.lives}`,
        shipState.current.x,
        shipState.current.y + 8
      );
      context.closePath();
      context.restore();
    }
  };
  return [shipState, update, draw, reset];
};

export default useShip;
