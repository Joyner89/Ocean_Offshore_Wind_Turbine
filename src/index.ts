import * as BABYLON from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUTintWASM } from "@babylonjs/core/Engines/WebGPU/webgpuTintWASM";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { getSceneModuleWithName } from "./createScene";

//import "@babylonjs/inspector";

const getModuleToLoad = (): string | undefined => location.search.split("scene=")[1];

const disableWebGPUUniformityAnalysis = (): void => {
    const tintWASMClass = WebGPUTintWASM as any;
    const tintWASMPrototype = tintWASMClass.prototype;

    tintWASMClass.DisableUniformityAnalysis = true;

    if (tintWASMPrototype.__oceanDemoUniformityPatchInstalled) {
        return;
    }

    const originalConvertSpirV2WGSL = tintWASMPrototype.convertSpirV2WGSL;
    const diagnosticDirective = "diagnostic(off, derivative_uniformity);";

    tintWASMPrototype.convertSpirV2WGSL = function(code: Uint32Array): string {
        const twgsl = (this as any)._twgsl;
        let shaderCode: string;

        // Babylon.js 5.28 没有 DisableUniformityAnalysis，手动复用新版 Babylon 的处理方式。
        if (twgsl && typeof twgsl.convertSpirV2WGSL === "function") {
            shaderCode = twgsl.convertSpirV2WGSL(code, true);
        } else {
            shaderCode = originalConvertSpirV2WGSL.call(this, code);
        }

        // 旧版 twgsl 会把部分 GLSL texture2D 转成 textureSampleBias(..., 0.0f)，
        // 新版浏览器会把它视为需要 uniform control flow 的隐式导数采样。
        // 这里改为显式 LOD 0 采样，避免 WebGPU 因 uniformity analysis 拒绝创建渲染管线。
        shaderCode = shaderCode.replace(/\btextureSampleBias\s*\(/g, "textureSampleLevel(");

        if (!shaderCode.startsWith(diagnosticDirective)) {
            shaderCode = `${diagnosticDirective}\n${shaderCode}`;
        }

        return shaderCode;
    };

    tintWASMPrototype.__oceanDemoUniformityPatchInstalled = true;
};

export const babylonInit = async (): Promise<void> => {
    // get the module to load
    const moduleName = getModuleToLoad();
    const createSceneModule = await getSceneModuleWithName(moduleName);

    (window as any).BABYLON = BABYLON; // required for ES6 to work for the time being

    // Execute the pretasks, if defined
    await Promise.all(createSceneModule.preTasks || []);
    // Get the canvas element
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    // Generate the BABYLON 3D engine
    //const engine = new Engine(canvas, true);

    let engine: Engine;
    const webgpuSupported = await WebGPUEngine.IsSupportedAsync;

    if (webgpuSupported) {
        // 新版浏览器的 WebGPU 校验更严格，旧版 Babylon.js 转译出的部分材质 WGSL 会触发 uniformity analysis。
        disableWebGPUUniformityAnalysis();

        // 当前 TypeScript 的 WebGPU 类型定义不包含 Babylon.js 旧示例中使用的全部特性名。
        const requiredFeatures = [
            "depth-clip-control",
            "depth24unorm-stencil8",
            "depth32float-stencil8",
            "texture-compression-bc",
            "texture-compression-etc2",
            "texture-compression-astc",
            "timestamp-query",
            "indirect-first-instance",
        ] as unknown as GPUFeatureName[];

        engine = new WebGPUEngine(canvas, {
            deviceDescriptor: {
                requiredFeatures,
            },
        });
        await (engine as WebGPUEngine).initAsync();

        if (!(engine as any)._features) {
            throw new Error("WebGPU 引擎初始化失败：请确认浏览器支持 WebGPU，并且可以加载 Babylon.js 的 glslang/twgsl 资源。");
        }
    } else {
        engine = new Engine(canvas, true);
    }

    // Create the scene
    const scene = await createSceneModule.createScene(engine, canvas);

    (window as any).engine = engine;
    (window as any).scene = scene;

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });
};

babylonInit().then(() => {
    // scene started rendering, everything is initialized
});
