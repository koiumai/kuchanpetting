// --- 設定ファイル ---
// このファイルは、アプリケーションの挙動を調整するための設定値を集約します。

// キャラクターの各レイヤー要素と、マウス追従の移動率を定義
export const characterConfig = {
    body: {
        element: document.getElementById('char-body'),
        moveRatio: { x: 0.035, y: 0.035 },
        interactive: true,
    },
    clothes: {
        element: document.getElementById('char-clothes'),
        moveRatio: { x: 0.035, y: 0.035 },
        interactive: true,
    },
    backHair: {
        element: document.getElementById('char-back-hair'),
        moveRatio: { x: 0.05, y: 0.075 },
        interactive: true,
    },
    horn: {
        element: document.getElementById('char-horn'),
        moveRatio: { x: 0.06, y: 0.085 },
        interactive: true,
    },
    mituami: {
        element: document.getElementById('char-mituami'),
        moveRatio: { x: 0.07, y: 0.095 },
        interactive: true,
    },
    baseFace: {
        element: document.getElementById('char-base-face'),
        moveRatio: { x: 0.075, y: 0.08 },
        interactive: true,
    },
    mouth: { // SVGの口レイヤー
        element: document.querySelector('.mouth-layer'),
        moveRatio: { x: 0.08, y: 0.1 },
        interactive: true,
    },
    browLayer: { // SVGの眉レイヤー
        element: document.querySelector('.brow-layer'),
        moveRatio: { x: 0.085, y: 0.11 },
        interactive: true,
    },
    eyesActual: {
        element: document.getElementById('char-eyes-actual'),
        moveRatio: { x: 0.1, y: 0.125 },
        interactive: true,
    },
    eyelid: { // SVGの上まぶたレイヤー
        element: document.querySelector('.eyelid-layer'),
        moveRatio: { x: 0.085, y: 0.1 },
        interactive: true,
    },
    frontHair: {
        element: document.getElementById('char-front-hair'),
        moveRatio: { x: 0.085, y: 0.115 },
        interactive: true,
    }
};

// ゲージ関連の設定
export const GAUGE_MAX = 100;
export const GAUGE_INCREASE_RATE = 0.1; // なでなでゲージの増加率
export const GAUGE_DECREASE_RATE = 0.01; // なでなでゲージの減少率
export const FULLNESS_DECREASE_RATE = 0.05; // 満腹度ゲージの減少率

// アニメーション関連の設定
export const ANIMATION_DURATION = 200; // ms

// 動きの制限
export const movementConfig = {
    // 最大移動範囲 (px)
    maxMove: { x: 200, y: 200 },
};

// まばたきアニメーションの設定 (現在は無効)
export const BLINK_DURATION = 1000; // ms
