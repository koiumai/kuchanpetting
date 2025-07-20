// --- メインアプリケーションファイル ---
// このファイルは、アプリケーション全体を初期化し、コアなロジックを実行します。

import { FULLNESS_DECREASE_RATE, BLINK_DURATION } from './config.js';
import { initUI } from './ui.js';

// --- DOM要素 ---
const loader = document.getElementById('loader');
const characterContainer = document.getElementById('character-container');

// --- アプリケーションの状態管理 ---
const state = {
    isPetting: false,
    pettingGauge: 0,
    fullnessGauge: 50, // 初期満腹度
    animationFrameId: null,
    isBlinking: false,
    blinkTimeoutId: null,
    currentExpression: 'sad', // 初期表情
};

// --- アセットのパス ---
const IMAGE_PATHS = [
    'assets/images/body.png', 'assets/images/back_hair.png', 'assets/images/horn.png', 'assets/images/mituami.png', 'assets/images/face_base.png',
    /* '../down_blow.png', '../up_blow.png', */ // これらはSVGに置き換えられる可能性
    'assets/images/eyes.png', 'assets/images/front_hair.png'
];
// SVGファイルのパスを定義
const SVG_PATHS = {
    // Mouth
    sad_mouth: 'assets/svg/sad_mouth.svg',
    smile_mouth: 'assets/svg/smile_mouth.svg',
    // Eyelids
    up_eyes: 'assets/svg/up_eyes.svg',
    middle_eyes: 'assets/svg/middle_eyes.svg',
    // Brows
    sad_blow: 'assets/svg/sad_blow.svg',
    smile_blow: 'assets/svg/smile_blow.svg',
};


// --- プリロード関数 ---
/**
 * 単一の画像をプリロードするPromiseを返す
 */
function loadImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve();
        img.onerror = () => {
            console.warn(`画像の読み込みに失敗しましたが、処理を続行します: ${url}`);
            resolve();
        };
    });
}

/**
 * 複数のSVGファイルを並行して読み込み、その内容を返す
 */
async function preloadSvgs(svgPaths) {
    const svgData = {};
    const promises = Object.entries(svgPaths).map(async ([key, path]) => {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`SVGの読み込みに失敗: ${path}`);
            svgData[key] = await response.text();
        } catch (error) {
            console.error(error);
            svgData[key] = null; 
        }
    });
    await Promise.all(promises);
    return svgData;
}

// --- アプリケーション表示 ---
function showApp() {
    if (loader) loader.classList.add('hidden');
    if (characterContainer) {
        characterContainer.classList.add('loaded');
    }
}

// --- メインループ ---
function mainLoop() {
    state.fullnessGauge = Math.max(0, state.fullnessGauge - FULLNESS_DECREASE_RATE);
    requestAnimationFrame(mainLoop);
}

// --- アプリケーションのメインロジック初期化 ---
async function initApp(preloadedSvgs) {
    await initUI(state, preloadedSvgs); // プリロードしたSVGテキストを渡す
    mainLoop();
}

// --- アプリケーション起動 ---
async function startApp() {
    await new Promise(resolve => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            resolve();
        } else {
            document.addEventListener('DOMContentLoaded', resolve);
        }
    });

    // 画像とSVGを並行してプリロード
    const [_, preloadedSvgs] = await Promise.all([
        Promise.all(IMAGE_PATHS.map(loadImage)),
        preloadSvgs(SVG_PATHS)
    ]);

    // UIの初期化（DOM生成）
    await initApp(preloadedSvgs);

    // すべての準備が完了したら、キャラクターを表示
    showApp();
}

// アプリケーション起動処理を開始
startApp();