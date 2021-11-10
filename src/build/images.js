"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCards = exports.generateOverview = exports.UnoType = exports.UnoColor = void 0;
const canvas_1 = require("canvas");
const ImageAssets = {
    CARDS_BG: {
        width: 23,
        height: 28,
        path: "assets/images/cardsHolding-2.png"
    },
    CARDS_ALL: {
        width: 1545,
        height: 815,
        path: "assets/images/cards.png"
    },
    CARD: {
        width: 103,
        height: 163,
        path: "assets/images/backface.png"
    }
};
var ColorScheme;
(function (ColorScheme) {
    ColorScheme["GRAY_0"] = "#202225";
    ColorScheme["GRAY_1"] = "#2F3136";
    ColorScheme["GRAY_2"] = "#36393F";
    ColorScheme["GRAY_3"] = "#4F545C";
    ColorScheme["WHITE_0"] = "#72767D";
    ColorScheme["WHITE_1"] = "#DCDDDE";
    ColorScheme["NITRO"] = "#FF73FA";
    ColorScheme["DANGER"] = "#ED4245";
    ColorScheme["SUCCESS"] = "#3BA55D";
})(ColorScheme || (ColorScheme = {}));
var UnoColor;
(function (UnoColor) {
    UnoColor[UnoColor["RED"] = 0] = "RED";
    UnoColor[UnoColor["YELLOW"] = 1] = "YELLOW";
    UnoColor[UnoColor["GREEN"] = 2] = "GREEN";
    UnoColor[UnoColor["BLUE"] = 3] = "BLUE";
    UnoColor[UnoColor["BLACK"] = 4] = "BLACK";
})(UnoColor = exports.UnoColor || (exports.UnoColor = {}));
var UnoType;
(function (UnoType) {
    UnoType[UnoType["ZERO"] = 0] = "ZERO";
    UnoType[UnoType["ONE"] = 1] = "ONE";
    UnoType[UnoType["TWO"] = 2] = "TWO";
    UnoType[UnoType["THREE"] = 3] = "THREE";
    UnoType[UnoType["FOUR"] = 4] = "FOUR";
    UnoType[UnoType["FIVE"] = 5] = "FIVE";
    UnoType[UnoType["SIX"] = 6] = "SIX";
    UnoType[UnoType["SEVEN"] = 7] = "SEVEN";
    UnoType[UnoType["EIGHT"] = 8] = "EIGHT";
    UnoType[UnoType["NINE"] = 9] = "NINE";
    UnoType[UnoType["SKIP"] = 10] = "SKIP";
    UnoType[UnoType["DRAW_TWO"] = 11] = "DRAW_TWO";
    UnoType[UnoType["REVERSE"] = 12] = "REVERSE";
    UnoType[UnoType["WILD_DRAW_FOUR"] = 13] = "WILD_DRAW_FOUR";
    UnoType[UnoType["WILD"] = 14] = "WILD";
})(UnoType = exports.UnoType || (exports.UnoType = {}));
const padding = 10;
const fontSize = 16;
const centerWidth = 100;
const cardsBgYAdjust = 2;
const cardsBgHeight = 34;
const cardsBgWidth = 28;
async function generateOverview(params) {
    (0, canvas_1.registerFont)("assets/font/Rubik-Bold.ttf", { family: "Rubik", weight: "bold" });
    const [widht, height] = [403, 156];
    const canvas = (0, canvas_1.createCanvas)(widht, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = ColorScheme.GRAY_1; // background color
    ctx.fillRect(0, 0, widht, height);
    ctx.font = `bold ${fontSize}px Rubik`;
    const maxFontWidth = (widht - 2 * padding - centerWidth) / 2 - cardsBgWidth;
    const maxCardNumberWidth = cardsBgWidth * 0.6;
    const cardsBg = await (0, canvas_1.loadImage)(ImageAssets.CARDS_BG.path);
    params.players.forEach((pl, i, arr) => {
        ctx.fillStyle = i === params.upNow ? ColorScheme.NITRO : ColorScheme.WHITE_0; // font color
        let cardsX = 0, baseY = 0;
        if (i < (arr.length / 2)) { // on the left side
            baseY = ((height - 2 * padding) / Math.ceil(arr.length / 2)) * (i + 0.5) + padding;
            ctx.fillText(pl.name, padding, baseY + fontSize / 2, maxFontWidth);
            cardsX = widht / 2 - centerWidth / 2 - cardsBgWidth;
        }
        else {
            baseY = ((height - 2 * padding) / Math.floor(arr.length / 2)) * (i - Math.ceil(arr.length / 2) + 0.5) + padding;
            const textWidth = Math.min(ctx.measureText(pl.name).width, maxFontWidth);
            ctx.fillText(pl.name, widht - padding - textWidth, baseY + fontSize / 2, maxFontWidth); // player name
            cardsX = widht / 2 + centerWidth / 2;
        }
        ctx.drawImage(cardsBg, cardsX, baseY - cardsBgHeight / 2 + cardsBgYAdjust, cardsBgWidth, cardsBgHeight); // card Background
        ctx.fillStyle = ColorScheme.GRAY_0;
        const cardTextWidth = Math.min(ctx.measureText(pl.cardsLeft.toFixed(0)).width, maxCardNumberWidth);
        ctx.fillText(pl.cardsLeft.toFixed(0), cardsX + (cardsBgWidth - cardTextWidth) / 2, baseY + fontSize / 2, maxCardNumberWidth); //card number
    });
    const allCards = await (0, canvas_1.loadImage)(ImageAssets.CARDS_ALL.path);
    // draw cards in center
    const cCardWidth = centerWidth * 0.5;
    const cCardHeight = (ImageAssets.CARD.height / ImageAssets.CARD.width) * cCardWidth;
    ctx.save();
    ctx.translate(widht / 2, height / 2);
    ctx.rotate(-20 * Math.PI / 180);
    params.playedCards.forEach((card) => {
        ctx.drawImage(allCards, card.type * ImageAssets.CARD.width, card.color * ImageAssets.CARD.height, ImageAssets.CARD.width, ImageAssets.CARD.height, -cCardWidth / 2, -cCardHeight / 2, cCardWidth, cCardHeight);
        ctx.rotate(20 * Math.PI / 180);
    });
    ctx.restore();
    return canvas;
}
exports.generateOverview = generateOverview;
const cardWidth = 55;
const cardHeight = 87;
//TODO produced Image may be smaller, scale down for faster computation and load times in discord 
async function generateCards(cards) {
    (0, canvas_1.registerFont)("assets/font/Rubik-Bold.ttf", { family: "Rubik", weight: "bold" });
    //* 12 cards per row!
    const nRows = Math.ceil(cards.length / 12);
    const [widht, height] = [
        cardWidth * 12 + padding * 3.1,
        padding * 2 + cardHeight * nRows + padding * 0.1 * (nRows - 1)
    ];
    const canvas = (0, canvas_1.createCanvas)(widht, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = ColorScheme.GRAY_1; // background color
    ctx.fillRect(0, 0, widht, height);
    const allCards = await (0, canvas_1.loadImage)(ImageAssets.CARDS_ALL.path);
    cards.forEach((card, i) => {
        ctx.drawImage(allCards, card.type * ImageAssets.CARD.width, card.color * ImageAssets.CARD.height, ImageAssets.CARD.width, ImageAssets.CARD.height, padding + (i % 12) * cardWidth + (i % 12) * padding * 0.1, padding + Math.floor(i / 12) * (cardHeight + padding * 0.1), cardWidth, cardHeight);
    });
    return canvas;
}
exports.generateCards = generateCards;
