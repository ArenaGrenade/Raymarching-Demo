import Scene from "./raymarcher/Scene";
import { Controls, withControls } from 'react-three-gui';
import { Canvas } from 'react-three-fiber'
import './App.css';

const CustomCanvas = withControls(Canvas);

const App = () => {
  return (
    <Controls.Provider>
      <CustomCanvas orthographic camera={[-1, 1, 1, -1, 0, 1]}>
        <Scene />
      </CustomCanvas>
      <Controls width={320}/>
    </Controls.Provider>
  );
}

export default App;
