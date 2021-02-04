import { useUpdate, useThree, useResource, useFrame } from "react-three-fiber"
import { vertexShader, fragmentShader } from "./shaders"
import { useControl } from "react-three-gui";

import * as THREE from "three"

const Floor = props => {
    const {gl: {domElement}, camera, scene, clock} = useThree();
    const meshRef = useUpdate(mesh => {
        // camera.attach(mesh);
        mesh.frustumCulled = false;
        // scene.add(camera);
        // camera.zoom = 0.9;
    }, []);
    const materialRef = useResource();
    const helper = useResource();
    const geometry = useResource();

    const isShader = useControl("Marching?", {type: "boolean", value: true});
    const power = useControl("Power", {type: "number", value: 1, min: 1, max: 10});
    const X = useControl("X", {type: "number", value: 0, min: -3, max: 3});
    const Y = useControl("Y", {type: "number", value: 0, min: -3, max: 3});
    const Z = useControl("Z", {type: "number", value: 0, min: -3, max: 3});

    useFrame(({gl: {domElement}, camera, clock}) => {
        meshRef.current?.position.set(0, 0, 0);
        helper.current?.update();
        camera.updateProjectionMatrix();

        if (isShader) {
            materialRef.current.onBeforeCompile = (shader) => materialRef.current.userData.shader = shader;

            if (materialRef.current.userData.shader) {
                const min_square = Math.min(window.innerWidth, window.innerHeight);
                materialRef.current.userData.shader.uniforms.resolution.value = new THREE.Vector2(min_square, min_square);
                materialRef.current.userData.shader.uniforms.viewportSize.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
                materialRef.current.userData.shader.uniforms.time.value = clock.elapsedTime;
                materialRef.current.userData.shader.uniforms.power.value = power;
                materialRef.current.userData.shader.uniforms.invTransformMat.value = new THREE.Matrix4().set(
                    1, 0, 0, -X, 
                    0, 1, 0, -Y,
                    0, 0, 1, -Z,
                    0, 0, 0, 0
                );
            }
        }
    });

    return (
        <>
            <mesh ref={meshRef}>
                <planeGeometry args={[2, 2]} ref={geometry} />
                {isShader ? 
                    <rawShaderMaterial args={[{
                        uniforms: {
                            resolution: { value: new THREE.Vector2(Math.min(window.innerWidth, window.innerHeight), Math.min(window.innerWidth, window.innerHeight)) },
                            viewportSize: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                            time: { value: clock.elapsedTime },
                            power: { value: power },
                            invTransformMat: { value: new THREE.Matrix4().set(1, 0, 0, -X, 0, 1, 0, -Y, 0, 0, 1, -Z, 0, 0, 0, 1) },
                        },
                        vertexShader,
                        fragmentShader
                    }]} ref={materialRef} />
                : <meshBasicMaterial args={[{color: 0xFF0000, side: THREE.DoubleSide}]} />}
            </mesh>
            {meshRef.current && <boxHelper args={[meshRef.current, 0xffff00]} ref={helper} />}
        </>
    )
}

export default Floor;