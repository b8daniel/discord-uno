import { createCanvas, loadImage, registerFont } from "canvas";

type ImagePlayerData = {
  name: string;
  cardsLeft: number;
};

export type UnoCard = {
  color: UnoColor;
  type: UnoType;
};

type OverviewData = {
  playedCards: UnoCard[];
  players: ImagePlayerData[];
  upNow: number;
  playingDirection: 1 | -1;
};

type AssetPathNames = "CARDS_BG" | "CARDS_ALL" | "CARD";
type ImageAsset = {
  width: number;
  height: number;
  path: `assets/images/${string}.png`;
};

const ImageAssets: Record<AssetPathNames, ImageAsset> = {
  CARDS_BG: {
    width: 23,
    height: 28,
    path: "assets/images/cardsHolding-2.png",
  },
  CARDS_ALL: {
    width: 1545, // 15 cards wide
    height: 815, // 5 cards high
    path: "assets/images/cards.png",
  },
  CARD: {
    width: 103,
    height: 163,
    path: "assets/images/backface.png",
  },
};

export enum ColorScheme {
  GRAY_0 = "#202225",
  GRAY_1 = "#2F3136",
  GRAY_2 = "#36393F",
  GRAY_3 = "#4F545C",
  WHITE_0 = "#72767D",
  WHITE_1 = "#DCDDDE",
  NITRO = "#FF73FA",
  DANGER = "#ED4245",
  SUCCESS = "#3BA55D",
}

export enum UnoColor {
  RED,
  YELLOW,
  GREEN,
  BLUE,
  BLACK,
}

export enum UnoType {
  ZERO,
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
  DRAW_TWO,
  REVERSE,
  WILD_DRAW_FOUR,
  WILD,
}

const padding = 10;
const fontSize = 16;
const centerWidth = 100;
const cardsBgYAdjust = 2;
const cardsBgHeight = 34;
const cardsBgWidth = 28;

export async function generateOverview(params: OverviewData) {
  registerFont("assets/font/Rubik-Bold.ttf", { family: "Rubik", weight: "bold" });
  const [widht, height] = [403, 156];
  const canvas = createCanvas(widht, height);

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = ColorScheme.GRAY_1; // background color
  ctx.fillRect(0, 0, widht, height);

  ctx.font = `bold ${fontSize}px Rubik`;
  const maxFontWidth = (widht - 2 * padding - centerWidth) / 2 - cardsBgWidth;
  const maxCardNumberWidth = cardsBgWidth * 0.6;
  const cardsBg = await loadImage(ImageAssets.CARDS_BG.path);

  params.players.forEach((pl, i, arr) => {
    ctx.fillStyle = i === params.upNow ? ColorScheme.NITRO : ColorScheme.WHITE_0; // font color

    let cardsX = 0,
      baseY = 0;

    if (i < arr.length / 2) {
      // on the left side
      baseY = ((height - 2 * padding) / Math.ceil(arr.length / 2)) * (i + 0.5) + padding;

      ctx.fillText(pl.name, padding, baseY + fontSize / 2, maxFontWidth);

      cardsX = widht / 2 - centerWidth / 2 - cardsBgWidth;
    } else {
      baseY =
        ((height - 2 * padding) / Math.floor(arr.length / 2)) *
          (i - Math.ceil(arr.length / 2) + 0.5) +
        padding;

      const textWidth = Math.min(ctx.measureText(pl.name).width, maxFontWidth);
      ctx.fillText(pl.name, widht - padding - textWidth, baseY + fontSize / 2, maxFontWidth); // player name

      cardsX = widht / 2 + centerWidth / 2;
    }

    ctx.drawImage(
      cardsBg,
      cardsX,
      baseY - cardsBgHeight / 2 + cardsBgYAdjust,
      cardsBgWidth,
      cardsBgHeight
    ); // card Background

    ctx.fillStyle = ColorScheme.GRAY_0;
    const cardTextWidth = Math.min(
      ctx.measureText(pl.cardsLeft.toFixed(0)).width,
      maxCardNumberWidth
    );
    ctx.fillText(
      pl.cardsLeft.toFixed(0),
      cardsX + (cardsBgWidth - cardTextWidth) / 2,
      baseY + fontSize / 2,
      maxCardNumberWidth
    ); //card number
  });

  const allCards = await loadImage(ImageAssets.CARDS_ALL.path);

  // draw cards in center
  const cCardWidth = centerWidth * 0.5;
  const cCardHeight = (ImageAssets.CARD.height / ImageAssets.CARD.width) * cCardWidth;

  ctx.save();
  ctx.translate(widht / 2, height / 2);
  ctx.rotate((-20 * Math.PI) / 180);
  params.playedCards.forEach(card => {
    ctx.drawImage(
      allCards,
      card.type * ImageAssets.CARD.width,
      card.color * ImageAssets.CARD.height,
      ImageAssets.CARD.width,
      ImageAssets.CARD.height,
      -cCardWidth / 2,
      -cCardHeight / 2,
      cCardWidth,
      cCardHeight
    );
    ctx.rotate((20 * Math.PI) / 180);
  });
  ctx.restore();
  return canvas;
}

const cardWidth = 55;
const cardHeight = 87;

//TODO produced Image may be smaller, scale down for faster computation and load times in discord
export async function generateCards(cards: UnoCard[]) {
  registerFont("assets/font/Rubik-Bold.ttf", { family: "Rubik", weight: "bold" });
  //* 12 cards per row!
  const nRows = Math.ceil(cards.length / 12);
  const [widht, height] = [
    cardWidth * 12 + padding * 3.1,
    padding * 2 + cardHeight * nRows + padding * 0.1 * (nRows - 1),
  ];

  const canvas = createCanvas(widht, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = ColorScheme.GRAY_1; // background color
  ctx.fillRect(0, 0, widht, height);

  const allCards = await loadImage(ImageAssets.CARDS_ALL.path);

  cards.forEach((card, i) => {
    ctx.drawImage(
      allCards,
      card.type * ImageAssets.CARD.width,
      card.color * ImageAssets.CARD.height,
      ImageAssets.CARD.width,
      ImageAssets.CARD.height,
      padding + (i % 12) * cardWidth + (i % 12) * padding * 0.1,
      padding + Math.floor(i / 12) * (cardHeight + padding * 0.1),
      cardWidth,
      cardHeight
    );
  });

  return canvas;
}
