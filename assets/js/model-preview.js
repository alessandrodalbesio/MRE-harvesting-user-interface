import * as THREE from "three"; /* Import the three.js module */
import { OBJLoader } from "threeOBJLoader"; /* Import the OBJLoader module */
import { OrbitControls } from "threeOrbitControls"; /* Import the OrbitControls module */

/* Default values */
const DEFAULT_AMBIENT_LIGHT = false;
const DEFAULT_SHADOWS_ACTIVE = true;
const DEFAULT_GROUND_COLOR = '#e1e1e1';
const DEFAULT_GROUND_SIZE = 25;
const DEFAULT_GROUND_VISIBLE = true;
const DEFAULT_BACKGROUND_COLOR = '#000000';
const DEFAULT_OBJECT_COLOR = '#ffffff';

/* Utilities functions (not exported) */
function checkDimensionValidity(dimension, dimensionName) {
    if (typeof dimension !== "number")
        throw new Error("The " + dimensionName + " must be a number");
    if (dimension <= 0)
        throw new Error("The " + dimensionName + " must be more than 0");
}

class modelPreviewManager {
    constructor(IDElement, width = 600, height = 400) {
        /* Inputs validation */
        if (typeof IDElement !== "string")
            throw new Error("The ID  must be a string");
        checkDimensionValidity(width, "width");
        checkDimensionValidity(height, "height");
        var parentElement = document.getElementById(IDElement);
        if (parentElement === null)
            throw new Error("The IDElement must be the ID of an existing element");


        /* Create the canvas */
        var canvas = document.createElement("canvas");
        parentElement.appendChild(canvas);


        /* Set up the scene */
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
            antialiasing: true,
            canvas: canvas,
            preserveDrawingBuffer: true
        });
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(DEFAULT_BACKGROUND_COLOR, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;


        /* Set up the lights */
        const lightColor = 0xFFFFFF;
        this.lightAmbient = new THREE.AmbientLight(lightColor, 0.5);
        this.lightDirectional = new THREE.DirectionalLight(0xffffff, 1);
        this.lightDirectional.position.set(5, 10, 8);
        this.lightDirectional.castShadow = DEFAULT_SHADOWS_ACTIVE;
        this.lightDirectional.shadow.mapSize = new THREE.Vector2(2048, 2048);
        this.lightDirectional.shadow.camera.near = 0.5;
        this.lightDirectional.shadow.camera.far = 500;

        if (DEFAULT_AMBIENT_LIGHT)
            this.scene.add(this.lightAmbient);
        else
            this.scene.add(this.lightDirectional);
        this.ambientLightInScene = DEFAULT_AMBIENT_LIGHT;

        /* Set up the camera*/
        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        this.camera.position.set(0, 5, 10);


        /* Define controller for rotating around objects and zooming */
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableZoom = true; /* enable zooming */
        this.controls.minPolarAngle = 0;
        this.controls.maxPolarAngle = Math.PI / 2 - Math.PI / 16;
        this.controls.enablePan = false;


        /* Define the ground */
        this.ground = new THREE.Mesh(
            new THREE.PlaneGeometry(DEFAULT_GROUND_SIZE, DEFAULT_GROUND_SIZE),
            new THREE.MeshStandardMaterial({
                color: DEFAULT_GROUND_COLOR,
            })
        );
        this.ground.castShadow = false;
        this.ground.receiveShadow = true;
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.visible = DEFAULT_GROUND_VISIBLE;
        this.scene.add(this.ground);

        /*
        if(!DEFAULT_GROUND_VISIBLE) {
            const size = 10;
            const divisions = 10;
            const gridHelper = new THREE.GridHelper( size, divisions );
            this.scene.add( gridHelper );
        }
        */

        /* Define the model reference and put it to null */
        this.model = null;

        /* Start the animation */
        this.animate();
    }

    refreshScene() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    animate() {
        this.refreshScene();
        requestAnimationFrame(() => this.animate());
    }


    applyTextureToModelFromImage(imageURL) {
        var material = new THREE.MeshStandardMaterial(); // create a material

        new THREE.TextureLoader().load(
            imageURL,
            (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.encoding = THREE.sRGBEncoding;
                material.map = texture;
                this.model.traverse((obj) => {
                    if (obj instanceof THREE.Mesh) {
                        obj.material = material;
                    }
                })
            },
            function (xhr) { },
            function (xhr) {
                console.log('An error happened');
            }
        );
    }


    applyTextureToModelFromColor(colorHex) {
        var material = new THREE.MeshStandardMaterial({
            color: colorHex,
        })
        this.model.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                obj.material = material;
            }
        })
        this.reloadLights();
    }


    captureScreenshot() {
        const dataURLtoFile = function (dataurl, filename) {

            var arr = dataurl.split(','),
                mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]),
                n = bstr.length,
                u8arr = new Uint8Array(n);

            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }

            return new File([u8arr], filename, { type: mime });
        }
        const componentToHex = function (c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }

        const rgbToHex = function (color) {
            let r = Math.round(color.r * 255);
            let g = Math.round(color.g * 255);
            let b = Math.round(color.b * 255);
            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
        }
        this.refreshScene();
        let rendererColor = new THREE.Color();
        this.renderer.getClearColor(rendererColor);
        return {
            'img': dataURLtoFile(this.renderer.domElement.toDataURL("image/png"), 'preview.png'),
            'imgDebug': this.renderer.domElement.toDataURL("image/png"),
            'cameraPositionX': this.camera.position.x,
            'cameraPositionY': this.camera.position.y,
            'cameraPositionZ': this.camera.position.z,
            'cameraRotationX': this.camera.rotation.x,
            'cameraRotationY': this.camera.rotation.y,
            'cameraRotationZ': this.camera.rotation.z,
            'cameraZoom': this.camera.zoom,
            'groundColor': rgbToHex(this.ground.material.color),
            'groundVisibility': this.ground.visible,
            'ambientLightInScene': this.ambientLightInScene,
            'shadows': this.lightDirectional.castShadow,
            'backgroundColor': rgbToHex(rendererColor),
        }
    }


    loadModelInScene(modelURL) {
        this.removeModelFromScene();
        let material = new THREE.MeshStandardMaterial({ color: DEFAULT_OBJECT_COLOR });
        var loader = new OBJLoader();
        loader.load(
            modelURL,
            (model) => {
                this.model = model;
                var refBox = new THREE.Box3().setFromObject(this.model);
                var translateVector = new THREE.Vector3(
                    refBox.min.x + (refBox.max.x - refBox.min.x) / 2,
                    refBox.min.y,
                    refBox.min.z + (refBox.max.z - refBox.min.z) / 2
                );
                this.model.traverse((obj) => {
                    if (obj instanceof THREE.Mesh) {
                        obj.castShadow = true;
                        obj.translateX(-translateVector.x);
                        obj.translateY(-translateVector.y);
                        obj.translateZ(-translateVector.z);
                        obj.material = material;
                    }
                });
                this.scene.add(this.model);
                this.reloadLights();
            },
            (xhr) => { },
            (error) => {
                console.log(error)
                throw new Error("An error occured while loading the model");

            }
        );
    }

    setSceneParameters(parameters) {
        this.camera.position.x = parameters.cameraPositionX;
        this.camera.position.y = parameters.cameraPositionY;
        this.camera.position.z = parameters.cameraPositionZ;
        this.camera.rotation.x = parameters.cameraRotationX;
        this.camera.rotation.y = parameters.cameraRotationY;
        this.camera.rotation.z = parameters.cameraRotationZ;
        this.camera.zoom = parameters.cameraZoom;
        this.camera.updateProjectionMatrix();
        this.ground.material.color.set(parameters.groundColor);
        this.ground.visible = parameters.groundVisibility;
        this.ambientLightInScene = parameters.ambientLightInScene;
        this.lightDirectional.castShadow = parameters.shadows;
        this.renderer.setClearColor(parameters.backgroundColor, 1);
        this.reloadLights();
    }

    removeModelFromScene() {
        if (this.model !== null) {
            this.scene.remove(this.model);
            this.model = null;
        }
    }


    resize(width, height) {
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    /* Needed to show correctly the textures and the colors when loaded */
    reloadLights() {
        if (this.ambientLightInScene) {
            this.scene.remove(this.lightAmbient);
            this.scene.add(this.lightAmbient);
        }
        else {
            this.scene.remove(this.lightDirectional);
            this.scene.add(this.lightDirectional);
        }
    }

    /* Method for setting the parameters from the GUI */
    setBackgroundColor(colorHex) {
        this.renderer.setClearColor(colorHex, 1);
        return true;
    }

    setGroundColor(colorHex) {
        this.ground.material = new THREE.MeshStandardMaterial({ color: colorHex });
        return true;
    }

    toggleGroundVisibility() {
        this.ground.visible = !this.ground.visible;
        return true;
    }

    toggleShadows() {
        this.lightDirectional.castShadow = !this.lightDirectional.castShadow;
        return true;
    }

    changeLightInScene() {
        if (this.ambientLightInScene) {
            this.scene.remove(this.lightAmbient);
            this.scene.add(this.lightDirectional);
        } else {
            this.scene.remove(this.lightDirectional);
            this.scene.add(this.lightAmbient);
        }
        this.ambientLightInScene = !this.ambientLightInScene;
        return true;
    }

    /* Get methods */
    get defaultGroundColor() { return DEFAULT_GROUND_COLOR }
    get defaultGroundVisibility() { return DEFAULT_GROUND_VISIBLE }
    get defaultBackgroundColor() { return DEFAULT_BACKGROUND_COLOR }
    get defaultShadows() { return DEFAULT_SHADOWS_ACTIVE }
    get defaultAmbientLight() { return DEFAULT_AMBIENT_LIGHT }
    get defaultObjectColor() { return DEFAULT_OBJECT_COLOR }
}
class modelPreviewManagerTextureUpload extends modelPreviewManager {
    constructor(IDElement, width = 600, height = 400) {
        super(IDElement, width, height);
        this.dataToSend = null;
    }
    loadModelInScene(modelURL, callbackFunction, nestedCallbackFunction, param) {
        this.removeModelFromScene();
        let material =new  THREE.MeshStandardMaterial({ color: DEFAULT_OBJECT_COLOR });
        var loader = new OBJLoader();
        loader.load(
            modelURL,
            (model) => {
                this.model = model;
                var refBox = new THREE.Box3().setFromObject(this.model);
                var translateVector = new THREE.Vector3(
                    refBox.min.x + (refBox.max.x - refBox.min.x) / 2,
                    refBox.min.y,
                    refBox.min.z + (refBox.max.z - refBox.min.z) / 2
                );
                this.model.traverse((obj) => {
                    if (obj instanceof THREE.Mesh) {
                        obj.castShadow = true;
                        obj.translateX(-translateVector.x);
                        obj.translateY(-translateVector.y);
                        obj.translateZ(-translateVector.z);
                        obj.material = material;
                    }
                });
                this.scene.add(this.model);
                this.reloadLights();
                callbackFunction(nestedCallbackFunction, param);
            },
            (xhr) => { },
            (error) => {
                console.log(error)
                throw new Error("An error occured while loading the model");
            }
        );
    }
}
export { modelPreviewManager, modelPreviewManagerTextureUpload };