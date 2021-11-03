import { createCanvas } from "canvas";

type ImagePlayerData = {
  name: string,
  cardsLeft: number,
};

type UnoCard = {
  color: UnoColor,
  type: UnoType;
};

type OverviewData = {
  playedCards: UnoCard[],
  players: ImagePlayerData[],
  upNow: number,
  playingDirection: 1 | -1,
};

export enum UnoColor {
  RED,
  YELLOW,
  GREEN,
  BLUE,
  BLACK,
}

export enum UnoType {
  ONE,
  TWO,
  THREE,
  FOUR,
  FIVE,
  SIX,
  SEVEN,
  EIGHT,
  NINE,
  SKIP,
  TAKE_TWO,
  REVERSE,
  FOUR_CHOOSE,
  COOSE,
}

export function generateOverview(params: OverviewData) {
  const canvas = createCanvas(120, 120);
  return canvas;
}

export function generateCards(cards: UnoCard[]) {
  const canvas = createCanvas(120, 120);
  return canvas;
}