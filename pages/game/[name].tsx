import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

export default function GamePage() {
  const router = useRouter();

  const Game = dynamic(
    () => {
      return import(`../../games/${router.query.name}`);
    },
    {
      ssr: false,
    }
  );

  return <Game />;
}
