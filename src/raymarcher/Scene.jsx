import { useThree, useFrame } from "react-three-fiber"
import { useEffect } from "react";

import Floor from "./Floor"

const Scene = props => {
    // The following code block runs the very first time as a setup.
    const { gl, camera, forceResize } = useThree();

    useEffect(() => {
        camera.near = 0;
        camera.far = 4000;
        camera.position.set(0, 0, 0);

        // Don't forget this
        camera.updateProjectionMatrix()

        gl.setSize(window.innerWidth, window.innerHeight);  
        gl.setPixelRatio(window.devicePixelRatio);
        forceResize();
    // eslint-disable-next-line
    }, []);

    useFrame(({gl: {domElement}, camera}) => {
        camera.left = - domElement.width / 2;
        camera.right = domElement.width / 2;
        camera.top = domElement.height / 2;
        camera.bottom = - domElement.height / 2;
        camera.updateProjectionMatrix();
    })

    return (
        <>
            <Floor />
            <axesHelper args={[300]} />
            {/*<cameraHelper args={[camera]} />*/}
        </>
    )
}

export default Scene;
