"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCards = exports.generateOverview = exports.UnoType = exports.UnoColor = void 0;
const canvas_1 = require("canvas");
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
    UnoType[UnoType["ONE"] = 0] = "ONE";
    UnoType[UnoType["TWO"] = 1] = "TWO";
    UnoType[UnoType["THREE"] = 2] = "THREE";
    UnoType[UnoType["FOUR"] = 3] = "FOUR";
    UnoType[UnoType["FIVE"] = 4] = "FIVE";
    UnoType[UnoType["SIX"] = 5] = "SIX";
    UnoType[UnoType["SEVEN"] = 6] = "SEVEN";
    UnoType[UnoType["EIGHT"] = 7] = "EIGHT";
    UnoType[UnoType["NINE"] = 8] = "NINE";
    UnoType[UnoType["SKIP"] = 9] = "SKIP";
    UnoType[UnoType["TAKE_TWO"] = 10] = "TAKE_TWO";
    UnoType[UnoType["REVERSE"] = 11] = "REVERSE";
    UnoType[UnoType["FOUR_CHOOSE"] = 12] = "FOUR_CHOOSE";
    UnoType[UnoType["COOSE"] = 13] = "COOSE";
})(UnoType = exports.UnoType || (exports.UnoType = {}));
function generateOverview(params) {
    const canvas = (0, canvas_1.createCanvas)(120, 120);
    return canvas;
}
exports.generateOverview = generateOverview;
function generateCards(cards) {
    const canvas = (0, canvas_1.createCanvas)(120, 120);
    return canvas;
}
exports.generateCards = generateCards;
