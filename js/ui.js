// --- UI関連のロジック (SVG版) ---
// このファイルは、ユーザーの操作に直接反応する処理をすべて集約します。

import { characterConfig, GAUGE_MAX, GAUGE_INCREASE_RATE, GAUGE_DECREASE_RATE, ANIMATION_DURATION } from './config.js';

// アプリケーションの状態を管理するオブジェクト
let state = {};
let uiElements = {};

// --- SVG関連の変数 ---
const mouthPaths = {}; // sad, smileなどをキーに持つ
let mouthPathElement = null;
let currentMouthAnimation = null;

const browPaths = {}; // sad, smile などをキーに持ち、それぞれに left, right のパスを持つ
let browPathElements = { left: null, right: null };
let currentBrowAnimations = { left: null, right: null };

const eyelidPaths = { open: { right: null, left: null }, middle: { right: null, left: null } };
let eyelidPathElements = { right: null, left: null };
let currentEyelidAnimation = { right: null, left: null };

// --- アニメーションと入力���状態 ---
const browContainerOffsetY = { value: 0 }; // なでなで時の眉のオフセット
let touchStartOffsetX = 0, touchStartOffsetY = 0;
let mouseOffsetX = 0, mouseOffsetY = 0; // マウスの相対位置を保持
let isDraggingFood = false, foodOffsetX = 0, foodOffsetY = 0;

// --- SVGヘルパー関数 ---
function parseSvgPathAttributes(svgText) {
    if (!svgText) return [];
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const pathElements = svgDoc.querySelectorAll('path');
    return Array.from(pathElements).map(path => ({
        d: path.getAttribute('d') || '',
        transform: path.getAttribute('transform') || ''
    }));
}

function parseTransform(transformString) {
    if (!transformString) return [1, 0, 0, 1, 0, 0];
    if (transformString.includes('matrix')) {
        const values = transformString.match(/matrix\(([^)]+)\)/)[1].split(/[\s,]+/);
        return values.map(Number);
    }
    if (transformString.includes('translate')) {
        const values = transformString.match(/translate\(([^)]+)\)/)[1].split(/[\s,]+/);
        return [1, 0, 0, 1, Number(values[0]), Number(values[1])];
    }
    return [1, 0, 0, 1, 0, 0];
}

// --- アニメーション関数 ---
function animateMouth(expression) {
    if (!mouthPathElement || !mouthPaths[expression]) return;
    if (currentMouthAnimation) currentMouthAnimation.pause();
    
    currentMouthAnimation = anime({
        targets: mouthPathElement,
        d: mouthPaths[expression].d,
        duration: ANIMATION_DURATION,
        easing: 'easeInOutQuad'
    });
}

function animateBrows(expression) {
    if (!browPaths[expression]) return;

    ['left', 'right'].forEach((side, index) => {
        const pathElement = browPathElements[side];
        const targetPath = browPaths[expression][side];
        if (!pathElement || !targetPath) return;

        if (currentBrowAnimations[side]) currentBrowAnimations[side].pause();

        currentBrowAnimations[side] = anime({
            targets: pathElement,
            d: targetPath.d,
            transform: targetPath.transform,
            duration: ANIMATION_DURATION,
            easing: 'easeInOutQuad'
        });
    });
}


function animateEyelids(state) {
    ['right', 'left'].forEach(side => {
        if (currentEyelidAnimation[side]) currentEyelidAnimation[side].pause();
        const targetPathData = eyelidPaths[state][side];
        const pathElement = eyelidPathElements[side];
        if (!targetPathData || !pathElement) return;

        anime({ targets: pathElement, d: targetPathData.d, duration: ANIMATION_DURATION, easing: 'easeInOutQuad' });

        const currentMatrix = parseTransform(pathElement.getAttribute('transform'));
        const targetMatrix = targetPathData.transform;
        const interpolator = { value: 0 };
        currentEyelidAnimation[side] = anime({
            targets: interpolator,
            value: 1,
            duration: ANIMATION_DURATION,
            easing: 'easeInOutQuad',
            update: () => {
                const newMatrix = currentMatrix.map((val, i) => val + (targetMatrix[i] - val) * interpolator.value);
                pathElement.setAttribute('transform', `matrix(${newMatrix.join(',')})`);
            }
        });
    });
}

// --- メインループと更新処理 ---
function updateEyeClipPath() {
    if (!uiElements.eyesActual || !uiElements.rightEyelidPath || !uiElements.leftEyelidPath) return;
    const eyeInner = uiElements.eyesActual.querySelector('.inner-breathe');
    if (!eyeInner) return;
    const eyeInnerRect = eyeInner.getBoundingClientRect();
    if (eyeInnerRect.height === 0) return;

    const rightEyelidRect = uiElements.rightEyelidPath.getBoundingClientRect();
    const leftEyelidRect = uiElements.leftEyelidPath.getBoundingClientRect();
    const upperY = Math.min(rightEyelidRect.top, leftEyelidRect.top);
    const upperOffset = 10;
    const relativeUpperY = (upperY + upperOffset) - eyeInnerRect.top;
    const clipTop = Math.max(0, Math.min(100, (relativeUpperY / eyeInnerRect.height) * 100));

    const openY = eyelidPaths.open.right.transform[5]; 
    const middleY = eyelidPaths.middle.right.transform[5];
    const currentY = parseTransform(eyelidPathElements.right.getAttribute('transform'))[5];
    const closeRatio = Math.max(0, Math.min(1, (currentY - openY) / (middleY - openY)));
    const clipBottom = 100 - (closeRatio * 45); 

    if (clipTop >= clipBottom) {
        eyeInner.style.clipPath = `polygon(0% ${clipTop}%, 100% ${clipTop}%, 100% ${clipTop}%, 0% ${clipTop}%)`;
    } else {
        eyeInner.style.clipPath = `polygon(0% ${clipTop}%, 100% ${clipTop}%, 100% ${clipBottom}%, 0% ${clipBottom}%)`;
    }
}

function updateLoop() {
    // ゲージ更新
    if (state.isPetting) {
        state.pettingGauge = Math.min(GAUGE_MAX, state.pettingGauge + GAUGE_INCREASE_RATE);
    } else {
        state.pettingGauge = Math.max(0, state.pettingGauge - GAUGE_DECREASE_RATE);
    }
    uiElements.pettingGaugeFill.style.height = `${state.pettingGauge}%`;
    uiElements.fullnessGaugeFill.style.height = `${state.fullnessGauge}%`;
    
    // 目のクリッピング更新
    updateEyeClipPath();

    // 全レイヤーの位置を更新
    for (const key in characterConfig) {
        const layer = characterConfig[key];
        if (layer.element && layer.interactive) {
            let moveX = mouseOffsetX * layer.moveRatio.x;
            let moveY = mouseOffsetY * layer.moveRatio.y;

            // 眉レイヤーの場合、なでなで時の追加オフセットを加算
            if (key === 'browLayer') {
                moveY += browContainerOffsetY.value;
            }

            layer.element.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
        }
    }

    // ループを継続
    state.animationFrameId = requestAnimationFrame(updateLoop);
}

// --- イベントハンドラ ---
function setExpression(expression) {
    state.currentExpression = expression;
    animateMouth(expression);
    animateBrows(expression);
    console.log(`Expression changed to: ${expression}`);
}

function handleMove(clientX, clientY, target) {
    const rect = uiElements.container.getBoundingClientRect();
    mouseOffsetX = clientX - (rect.left + rect.width / 2) - touchStartOffsetX;
    mouseOffsetY = clientY - (rect.top + rect.height / 2) - touchStartOffsetY;

    if (!state.isPetting) {
        state.isPetting = true;
        uiElements.statusText.textContent = 'なでなで中...';
        animateMouth('smile');
        animateBrows('smile');
        animateEyelids('middle');

        // 眉コンテナを少し下に動かすアニメーション
        anime({
            targets: browContainerOffsetY,
            value: 20, // 5px下に動かす
            duration: ANIMATION_DURATION,
            easing: 'easeOutQuad'
        });

        if (!state.animationFrameId) {
            state.animationFrameId = requestAnimationFrame(updateLoop);
        }
    }
}

function handleEnd() {
    if (state.isPetting) {
        state.isPetting = false;
        uiElements.statusText.textContent = 'なでなでをやめました';
        setExpression(state.currentExpression);
        animateEyelids('open');

        // 眉コンテナを元の位置に戻すアニメーション
        anime({
            targets: browContainerOffsetY,
            value: 0,
            duration: ANIMATION_DURATION,
            easing: 'easeOutQuad'
        });
    }
    mouseOffsetX = 0;
    mouseOffsetY = 0;
    touchStartOffsetX = 0;
    touchStartOffsetY = 0;
}

function onFoodStart(e) {
    isDraggingFood = true;
    uiElements.foodIcon.classList.add('is-dragging');
    uiElements.statusText.textContent = 'ごはんをどうぞ！';
    const rect = uiElements.foodIcon.getBoundingClientRect();
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    foodOffsetX = clientX - rect.left;
    foodOffsetY = clientY - rect.top;
    window.addEventListener('mousemove', onFoodMove);
    window.addEventListener('mouseup', onFoodEnd);
    window.addEventListener('touchmove', onFoodMove, { passive: false });
    window.addEventListener('touchend', onFoodEnd);
    e.preventDefault();
}

function onFoodMove(e) {
    if (!isDraggingFood) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    uiElements.foodIcon.style.position = 'fixed'; 
    uiElements.foodIcon.style.left = `${clientX - foodOffsetX}px`;
    uiElements.foodIcon.style.top = `${clientY - foodOffsetY}px`;
    e.preventDefault();
}

function onFoodEnd(e) {
    if (!isDraggingFood) return;
    isDraggingFood = false;
    uiElements.foodIcon.classList.remove('is-dragging');
    const foodRect = uiElements.foodIcon.getBoundingClientRect();
    const mouthRect = uiElements.mouthArea.getBoundingClientRect();
    const isOverMouth = (foodRect.left < mouthRect.right && foodRect.right > mouthRect.left && foodRect.top < mouthRect.bottom && foodRect.bottom > mouthRect.top);
    if (isOverMouth) {
        uiElements.statusText.textContent = 'もぐもぐ！';
        animateMouth('smile');
        uiElements.foodIcon.style.display = 'none';
        state.fullnessGauge = Math.min(GAUGE_MAX, state.fullnessGauge + 30);
        uiElements.fullnessGaugeFill.style.height = `${state.fullnessGauge}%`;
        if (!state.animationFrameId) requestAnimationFrame(updateLoop);
        setTimeout(() => {
            setExpression(state.currentExpression);
            uiElements.statusText.textContent = 'ごちそうさま！';
            setTimeout(() => {
                uiElements.foodIcon.style.display = 'block';
                uiElements.foodIcon.style.position = 'absolute';
                uiElements.foodIcon.style.left = '';
                uiElements.foodIcon.style.top = '';
                uiElements.statusText.textContent = 'キャラクターの頭を撫でてね';
            }, 2000);
        }, 1500);
    } else {
        uiElements.statusText.textContent = 'キャラクターの頭を撫でてね';
        uiElements.foodIcon.style.position = 'absolute';
        uiElements.foodIcon.style.left = '';
        uiElements.foodIcon.style.top = '';
    }
    window.removeEventListener('mousemove', onFoodMove);
    window.removeEventListener('mouseup', onFoodEnd);
    window.removeEventListener('touchmove', onFoodMove);
    window.removeEventListener('touchend', onFoodEnd);
}

function createSinglePathPart(container, preloadedSvgs, partName, pathMap) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 360 480");
    svg.style.cssText = "width:100%; height:100%; overflow:visible;";
    const g = document.createElementNS(svgNS, "g");
    const pathElement = document.createElementNS(svgNS, "path");
    
    pathElement.setAttribute("fill", "none");
    pathElement.setAttribute("stroke", "#2d0004");
    pathElement.setAttribute("stroke-width", "1.284");
    pathElement.setAttribute("stroke-linecap", "square");
    pathElement.setAttribute("stroke-linejoin", "bevel");

    g.appendChild(pathElement);
    svg.appendChild(g);
    container.appendChild(svg);

    const sadData = parseSvgPathAttributes(preloadedSvgs[`sad_${partName}`])[0];
    const smileData = parseSvgPathAttributes(preloadedSvgs[`smile_${partName}`])[0];

    if (sadData) {
        pathMap.sad = sadData;
        g.setAttribute("transform", sadData.transform);
        pathElement.setAttribute('d', sadData.d);
    }
    if (smileData) pathMap.smile = smileData;

    return pathElement;
}

function createDualPathPart(container, preloadedSvgs, partName, pathMap) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 360 480");
    svg.style.cssText = "width:100%; height:100%; overflow:visible;";
    const g = document.createElementNS(svgNS, "g");
    const rightPath = document.createElementNS(svgNS, "path");
    const leftPath = document.createElementNS(svgNS, "path");

    [leftPath, rightPath].forEach(path => {
        path.setAttribute("fill", "#2d0004");
        path.setAttribute("stroke", "#2d0004");
        path.setAttribute("stroke-width", "0.48");
        path.setAttribute("stroke-linecap", "square");
        path.setAttribute("stroke-linejoin", "bevel");
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);

    const sadPaths = parseSvgPathAttributes(preloadedSvgs[`sad_${partName}`]);
    const smilePaths = parseSvgPathAttributes(preloadedSvgs[`smile_${partName}`]);

    if (sadPaths && sadPaths.length >= 2) {
        pathMap.sad = { right: sadPaths[0], left: sadPaths[1] };
        rightPath.setAttribute('d', sadPaths[0].d);
        rightPath.setAttribute('transform', sadPaths[0].transform);
        leftPath.setAttribute('d', sadPaths[1].d);
        leftPath.setAttribute('transform', sadPaths[1].transform);
    }
    if (smilePaths && smilePaths.length >= 2) {
        pathMap.smile = { right: smilePaths[0], left: smilePaths[1] };
    }

    return { left: leftPath, right: rightPath };
}


// --- 初期化 --- 
export function initUI(appState, preloadedSvgs) {
    state = appState;

    uiElements = {
        container: document.getElementById('character-container'),
        statusText: document.getElementById('status-text'),
        pettingGaugeFill: document.getElementById('petting-gauge-fill'),
        fullnessGaugeFill: document.getElementById('fullness-gauge-fill'),
        foodIcon: document.getElementById('food-icon'),
        mouthArea: document.querySelector('.mouth-layer'),
        browArea: document.querySelector('.brow-layer'),
        eyelid: document.querySelector('.eyelid-layer'),
        eyesActual: document.getElementById('char-eyes-actual'),
        // Toolbar
        toolbar: document.getElementById('ui-toolbar'),
        menuToggleButton: document.getElementById('menu-toggle-button'),
        menuOptions: document.getElementById('menu-options'),
    };

    // --- SVGパーツの初期化 ---
    // 口 (単一パス)
    const mouthContainer = uiElements.mouthArea.querySelector('.inner-svg');
    mouthPathElement = createSinglePathPart(mouthContainer, preloadedSvgs, 'mouth', mouthPaths);
    
    // 眉 (左右のデュアルパス)
    const browContainer = uiElements.browArea.querySelector('.inner-svg');
    browPathElements = createDualPathPart(browContainer, preloadedSvgs, 'blow', browPaths);

    // 上まぶた
    const eyelidContainer = uiElements.eyelid.querySelector('.inner-svg');
    const eyelidSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    eyelidSvg.setAttribute("viewBox", "0 0 360 480");
    eyelidSvg.style.cssText = "width:100%; height:100%; overflow:visible;";
    const eyelidG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rightEyelidPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const leftEyelidPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    eyelidPathElements = { right: rightEyelidPath, left: leftEyelidPath };
    uiElements.rightEyelidPath = rightEyelidPath;
    uiElements.leftEyelidPath = leftEyelidPath;
    [rightEyelidPath, leftEyelidPath].forEach(path => {
        path.setAttribute("fill", "#2b0000");
        path.setAttribute("stroke", "#2d0004");
        path.setAttribute("stroke-width", "0.48");
        path.setAttribute("stroke-linecap", "square");
        path.setAttribute("stroke-linejoin", "bevel");
    });
    eyelidG.appendChild(rightEyelidPath);
    eyelidG.appendChild(leftEyelidPath);
    eyelidSvg.appendChild(eyelidG);
    eyelidContainer.appendChild(eyelidSvg);

    const openEyePaths = parseSvgPathAttributes(preloadedSvgs.up_eyes);
    const middleEyePaths = parseSvgPathAttributes(preloadedSvgs.middle_eyes);

    if (openEyePaths.length >= 2 && middleEyePaths.length >= 2) {
        eyelidPaths.open.right = { d: openEyePaths[0].d, transform: parseTransform(openEyePaths[0].transform) };
        eyelidPaths.open.left = { d: openEyePaths[1].d, transform: parseTransform(openEyePaths[1].transform) };
        eyelidPaths.middle.right = { d: middleEyePaths[0].d, transform: parseTransform(middleEyePaths[0].transform) };
        eyelidPaths.middle.left = { d: middleEyePaths[1].d, transform: parseTransform(middleEyePaths[1].transform) };

        rightEyelidPath.setAttribute("transform", `matrix(${eyelidPaths.open.right.transform.join(',')})`);
        rightEyelidPath.setAttribute("d", eyelidPaths.open.right.d);
        leftEyelidPath.setAttribute("transform", `matrix(${eyelidPaths.open.left.transform.join(',')})`);
        leftEyelidPath.setAttribute("d", eyelidPaths.open.left.d);
    }

    // --- イベントリスナー設定 ---
    uiElements.container.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY, e.target));
    uiElements.container.addEventListener('mouseleave', handleEnd);
    uiElements.container.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const rect = uiElements.container.getBoundingClientRect();
            touchStartOffsetX = touch.clientX - (rect.left + rect.width / 2);
            touchStartOffsetY = touch.clientY - (rect.top + rect.height / 2);
        }
    }, { passive: false });
    uiElements.container.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
            handleMove(touch.clientX, touch.clientY, targetElement);
        }
    }, { passive: false });
    uiElements.container.addEventListener('touchend', handleEnd);
    uiElements.container.addEventListener('touchcancel', handleEnd);
    uiElements.foodIcon.addEventListener('mousedown', onFoodStart);
    uiElements.foodIcon.addEventListener('touchstart', onFoodStart, { passive: false });

    // Toolbar listeners
    uiElements.menuToggleButton.addEventListener('click', () => {
        uiElements.toolbar.classList.toggle('is-open');
    });
    uiElements.menuOptions.addEventListener('click', (e) => {
        const button = e.target.closest('.menu-button');
        if (button && button.dataset.expression) {
            setExpression(button.dataset.expression);
        }
    });


    // --- 初期描画 & ループ開始 ---
    setExpression(state.currentExpression); // 初期表情を適用
    uiElements.pettingGaugeFill.style.height = `${state.pettingGauge}%`;
    uiElements.fullnessGaugeFill.style.height = `${state.fullnessGauge}%`;
    if (!state.animationFrameId) {
        state.animationFrameId = requestAnimationFrame(updateLoop);
    }
}