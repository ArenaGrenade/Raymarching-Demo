import React from 'react';
import { useThree, useFrame, extend } from "react-three-fiber";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

extend({ OrbitControls })

const CameraController = React.forwardRef((props, ref) => {
    const {gl: {domElement}, camera} = useThree();
    useFrame(() => {
        ref.current.update();
    });
    return (
        <>
            <orbitControls ref={ref} args={[camera, domElement]} />
        </>
    )
});

export default CameraController;
