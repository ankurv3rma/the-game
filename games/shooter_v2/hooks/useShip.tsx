import { ReducerAction, useEffect, useReducer } from "react";

enum ActionType {
  MOVE = "MOVE",
  HIT = "HIT",
  DESTROY = "DESTROY",
}

interface ActionInterface {
  type: ActionType;
  payload: Partial<ShipInterface>;
}

enum Alignment {
  Top = "TOP",
  Bottom = "BOTTOM",
  Left = "LEFT",
  Right = "RIGHT",
}

interface ShipInterface {
  x: number;
  y: number;
  width: number;
  height: number;
  alignment: Alignment;
  color: string;
  lives: number;
  isDead: boolean;
  isHit: boolean;
}

const useShip = (
  x: number,
  y: number,
  width: number,
  height: number,
  alignment: Alignment,
  color: string,
  lives: number = 1
) => {
  // this.x = x;
  // this.y = y;
  // this.width = width;
  // this.height = height;
  // this.color = color;
  // this.alignment = alignment;
  // this.isDead = false;
  // this.lives = lives;
  // this.isHit = false;

  const initialState: ShipInterface = {
    x: x,
    y: y,
    width: width,
    height: height,
    color: color,
    alignment: alignment,
    lives: lives,
    isDead: false,
    isHit: false,
  };

  const reducer = (state: ShipInterface, action: ActionInterface) => {
    const { type, payload } = action;
    switch (type) {
      case ActionType.MOVE:
        return { ...state, y: payload.y } as ShipInterface;
      case ActionType.HIT:
        return {
          ...state,
          lives: (state.lives -= 1),
          isHit: true,
        } as ShipInterface;
      case ActionType.DESTROY:
        return {
          ...state,
          lives: (state.lives -= 1),
        };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {}, [state]);

  // this.init = function () {
  //   switch (this.alignment) {
  //     case "top": {
  //       this.x = x * stageWidth + shipWidth;
  //       this.y = y * stageHeight + shipHeight;
  //       break;
  //     }
  //     case "bottom": {
  //       this.x = x * stageWidth + shipWidth;
  //       this.y = y * stageHeight - shipHeight;
  //       break;
  //     }
  //     case "left": {
  //       this.x = x * stageWidth + shipWidth;
  //       this.y = y * stageWidth;
  //       break;
  //     }
  //     case "right": {
  //       this.x = x * stageWidth - shipWidth;
  //       this.y = y * stageWidth;
  //       break;
  //     }
  //   }
  // };

  // this.update = function () {
  //   if (canvasRef.current) {
  //     switch (this.alignment) {
  //       case "top": {
  //         if (mouse.current.x * stageWidth <= this.width) {
  //           this.x = this.width;
  //         } else if (mouse.current.x * stageWidth > stageWidth - this.width) {
  //           this.x = mouse.current.x * stageWidth - this.width;
  //         } else {
  //           this.x = mouse.current.x * stageWidth;
  //         }
  //         break;
  //       }
  //       case "bottom": {
  //         if (mouse.current.x * stageWidth <= this.width) {
  //           this.x = this.width;
  //         } else if (mouse.current.x * stageWidth >= stageWidth - this.width) {
  //           this.x = mouse.current.x * stageWidth - this.width;
  //         } else {
  //           this.x = mouse.current.x * stageWidth;
  //         }
  //         break;
  //       }
  //       case "left": {
  //         if (mouse.current.y * stageHeight <= this.height) {
  //           this.y = this.height;
  //         } else if (
  //           mouse.current.y * stageHeight >
  //           stageHeight - this.height
  //         ) {
  //           this.y = mouse.current.y * stageHeight - this.height;
  //         } else {
  //           this.y = mouse.current.y * stageHeight;
  //         }
  //         break;
  //       }
  //       case "right": {
  //         if (mouse.current.y * stageHeight <= this.height) {
  //           this.y = this.height;
  //         } else if (
  //           mouse.current.y * stageHeight >
  //           stageHeight - this.height
  //         ) {
  //           this.y = mouse.current.y * stageHeight - this.height;
  //         } else {
  //           this.y = mouse.current.y * stageHeight;
  //         }

  //         break;
  //       }
  //     }
  //   }

  //   this.draw();
  // };

  const draw = function (context: CanvasRenderingContext2D) {
    if (context) {
      context.save();
      context.beginPath();
      context.arc(state.x, state.y, state.width, 0, Math.PI * 2, false);
      context.fillStyle = state.color;
      context.shadowColor = state.color;
      context.shadowBlur = state.width;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.fill();
      context.textAlign = "center";
      context.strokeStyle = "#ffffff";
      context.font = "bold 16pt comic sans ms";
      context.fillStyle = "white";
      context.shadowColor = state.color;
      context.shadowBlur = state.width;
      context.fillText(`${state.lives}`, state.x, state.y + 8);
      context.closePath();
      context.restore();
    }
  };
  return [state, draw, dispatch];
};

export default useShip;
