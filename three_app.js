import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

// 1. シーンの作成
const scene = new THREE.Scene();

// 2. カメラの作成
// 平面を真正面から、画像のピクセルと同じ縮尺で見るために、OrthographicCameraを使用します。
const camera = new THREE.OrthographicCamera(
    window.innerWidth / -2,
    window.innerWidth / 2,
    window.innerHeight / 2,
    window.innerHeight / -2,
    1,
    1000
);
camera.position.z = 1;

// 3. レンダラーの作成
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. テクスチャの読み込み
const textureLoader = new THREE.TextureLoader();
const faceTexture = textureLoader.load('face_base.png', (texture) => {
    // 画像のアスペクト比を保つように平面のサイズを調整
    const aspectRatio = texture.image.width / texture.image.height;
    const planeHeight = 600; // 表示したい高さを適当に設定（後で調整可能）
    const planeWidth = planeHeight * aspectRatio;

    // 5. 平面ジオメトリの作成 (10x10のセグメントに分割)
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 10, 10);

    // 6. マテリアルの作成
    const material = new THREE.MeshBasicMaterial({ 
        map: faceTexture,
        transparent: true // 透明部分を透過させる
    });

    // 7. メッシュの作成
    const plane = new THREE.Mesh(geometry, material);

    // 8. シーンへの追加
    scene.add(plane);

    // 9. レンダリング
    renderer.render(scene, camera);
});

// ウィンドウリサイズへの対応
window.addEventListener('resize', () => {
    camera.left = window.innerWidth / -2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = window.innerHeight / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
});
