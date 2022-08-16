import { useState } from "react";
import { BsTriangleFill } from "react-icons/bs";
import { BEATS_PER_BAR } from "../lib/constants";

type BlockType = {
  rowId: number;
  colId: number;
  playAndAddNote: ({ note, colId }: { note: string; colId: number }) => void;
  removeNote: ({ note, colId }: { note: string; colId: number }) => void;
  note: string;
  playingCol: number;
  playAndAddDrumNote: ({
    name,
    colId,
  }: {
    name: string;
    colId: number;
  }) => void;
  removeBeats: ({ note, colId }: { note: string; colId: number }) => void;
};

const red: string = "bg-red-600";
const orange: string = "bg-orange-400";
const yellow: string = "bg-yellow-300";
const green: string = "bg-green-400";
const darkGreen: string = "bg-green-700 ";
const purple: string = "bg-purple-600";
const pink: string = "bg-pink-400";

const colors = [pink, purple, darkGreen, green, yellow, orange, red];

const Block = ({
  rowId,
  colId,
  playAndAddNote,
  note,
  playingCol,
  removeNote,
  playAndAddDrumNote,
  removeBeats,
}: BlockType) => {
  const [isSelected, setIsSelected] = useState<boolean>(false);

  const selectBlock = (rowId: number, event: React.MouseEvent) => {
    if (event.type === "mouseenter" && event.buttons === 1 && rowId < 14) {
      setIsSelected(true);
      playAndAddNote({ note, colId });
    } else if (event.type === "click" && rowId < 14) {
      if (!isSelected) {
        playAndAddNote({ note, colId });
      } else {
        removeNote({ note, colId });
      }
      setIsSelected(!isSelected);
    } else if (event.type === "click" && rowId >= 14) {
      if (!isSelected) {
        playAndAddDrumNote({ name: note, colId });
      } else {
        removeBeats({ note, colId });
      }
      setIsSelected(!isSelected);
    }
  };

  return (
    <div
      onMouseEnter={selectBlock.bind(null, rowId)}
      onClick={selectBlock.bind(null, rowId)}
      className={`h-[calc((100vh-190px)/16)] border-solid border-[0.5px] border-blue-100 flex justify-center items-center ${
        (colId + 1) % 2 === 0 ? "border-r-blue-400" : ""
      } ${rowId === 7 ? "border-t-blue-400" : ""}
      ${rowId === 13 ? "border-b-gray-300 border-b-[2px]" : ""}
      ${rowId >= 14 ? "border-0 border-r-[0.5px]" : ""}
      ${
        (Math.floor(colId / (BEATS_PER_BAR * 2)) + 1) % 2 == 0 && !isSelected
          ? "bg-gray-50"
          : rowId >= 14
          ? "bg-gray-50"
          : ""
      }
      ${isSelected && rowId < 14 ? colors[rowId % colors.length] : ""}
      ${
        playingCol == colId && !isSelected
          ? "bg-blue-100"
          : playingCol == colId && isSelected && rowId < 14
          ? "animate-bounce"
          : ""
      }
      ${playingCol == colId && isSelected && rowId >= 14 ? "bg-blue-100" : ""}
      `}
    >
      {rowId == 14 && (
        <div>
          {isSelected ? (
            <BsTriangleFill
              color="#16a8f0"
              size={16}
              className={`${
                playingCol == colId && isSelected && rowId >= 14
                  ? "animate-ping"
                  : ""
              }`}
            />
          ) : (
            <div
              className={`${
                (colId + 1) % 2 == 0 ? "h-1 w-1" : "h-2 w-2"
              } bg-gray-300 rounded-full`}
            />
          )}
        </div>
      )}
      {rowId == 15 && (
        <div>
          {isSelected ? (
            <div
              className={`h-3 w-3 bg-blue rounded-full ${
                playingCol == colId && isSelected && rowId >= 14
                  ? "animate-ping"
                  : ""
              }`}
            />
          ) : (
            <div
              className={`${
                (colId + 1) % 2 == 0 ? "h-1 w-1" : "h-2 w-2"
              } bg-gray-300 rounded-full`}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Block;
