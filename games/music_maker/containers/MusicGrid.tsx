import Block from "../components/Block";
import { useState, useEffect } from "react";
import { PolySynth, Player } from "tone";
import Drums from "../enums/drums.enum";
import { NOTES, BAR_LENGTH, INCREASE_PERCENTAGE } from "../lib/constants";
import { RiLoader4Line } from "react-icons/ri";

// dynamically generated classes are mentioned here to avoid tailwind css purge related bugs

// lg:w-[100%] lg:w-[125%] lg:w-[150%] lg:w-[175%] lg:w-[200%]
// w-[320%] w-[345%] w-[100%]
// tablet:w-[200%] tablet:w-[225%] tablet:w-[100%]

type MusicGridType = {
  currentCol: number;
  setTouchedNotes: ({
    note,
    colId,
    remove,
  }: {
    note: string;
    colId: number;
    remove?: boolean;
  }) => void;
  instrument: PolySynth | null;
  snare: Player | null;
  kick: Player | null;
  setTouchedDrumNotes: ({
    note,
    colId,
    remove,
  }: {
    note: string;
    colId: number;
    remove?: boolean;
  }) => void;
  noteDuration: string;
  musicSheetRef: React.MutableRefObject<HTMLDivElement | null>;
  currentBlockRef: React.MutableRefObject<HTMLDivElement | null>;
  numOfSheetColumns: number;
  barLength: number;
};

const MusicGrid = ({
  currentCol,
  setTouchedNotes,
  instrument,
  kick,
  snare,
  setTouchedDrumNotes,
  noteDuration,
  musicSheetRef,
  currentBlockRef,
  numOfSheetColumns,
  barLength,
}: MusicGridType) => {
  const [musicSheet, setMusicSheet] = useState<[][] | null>(null);
  const increaseFactor =
    INCREASE_PERCENTAGE *
    (barLength - BAR_LENGTH > 0 ? barLength - BAR_LENGTH : 0);
  const mobileIncreaseFactor =
    barLength - BAR_LENGTH > 0 ? INCREASE_PERCENTAGE : 0;

  useEffect(() => {
    let musicSheet = new Array(16);
    const baseScale = 5;
    for (let i = 0; i < musicSheet.length - 2; i++) {
      const startScale = baseScale - Math.floor(i / NOTES.length);
      musicSheet[i] = new Array(numOfSheetColumns).fill(
        NOTES[i % NOTES.length] + startScale
      );
    }
    for (let i = musicSheet.length - 2; i < musicSheet.length; i++) {
      musicSheet[i] = new Array(numOfSheetColumns).fill(
        i === musicSheet.length - 2 ? Drums.SNARE : Drums.KICK
      );
    }
    setMusicSheet(musicSheet);
  }, [numOfSheetColumns]);

  function playAndCaptureNote({
    note,
    colId,
  }: {
    note: string;
    colId: number;
  }) {
    setTouchedNotes({ note, colId });
    instrument?.triggerAttackRelease(note, noteDuration);
  }

  const removeNote = ({ note, colId }: { note: string; colId: number }) => {
    setTouchedNotes({ note, colId, remove: true });
  };

  const removeBeats = ({ note, colId }: { note: string; colId: number }) => {
    setTouchedDrumNotes({ note, colId, remove: true });
  };

  function playAndCaptureDrumNote({
    name,
    colId,
  }: {
    name: string;
    colId: number;
  }) {
    setTouchedDrumNotes({ note: name, colId });
    if (name == Drums.KICK) {
      kick?.start();
    } else {
      snare?.start();
    }
  }

  return musicSheet != null ? ( // [@TODO: Add Suspense]
    <div
      className="absolute w-full top-[81px] h-[calc(100%-190px)] flex overflow-x-auto bg-white"
      ref={musicSheetRef}
    >
      <div
        className={`relative w-[${
          barLength - BAR_LENGTH < -1 ? 100 : 320 + mobileIncreaseFactor
        }%] tablet:w-[${
          barLength - BAR_LENGTH < -1 ? 100 : 200 + mobileIncreaseFactor
        }%] lg:w-[${100 + increaseFactor}%] overflow-hidden shrink-0`}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${numOfSheetColumns}, minmax(0, 1fr))`,
          }}
        >
          {musicSheet.map((rowItem, rowId) => {
            return rowItem.map((note, colId) => {
              return (
                <div
                  ref={
                    colId == currentCol + 5 && rowId === 0
                      ? currentBlockRef
                      : null
                  }
                  key={"" + rowId + colId}
                >
                  <Block
                    rowId={rowId}
                    colId={colId}
                    note={note}
                    playAndAddNote={playAndCaptureNote}
                    playingCol={currentCol}
                    removeNote={removeNote}
                    playAndAddDrumNote={playAndCaptureDrumNote}
                    removeBeats={removeBeats}
                  />
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  ) : (
    <div className="absolute inset-0 flex justify-center items-center">
      <RiLoader4Line size={64} color="#16a8f0" className="animate-spin" />
    </div>
  );
};

export default MusicGrid;
