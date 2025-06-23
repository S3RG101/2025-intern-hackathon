import logo from './logo.svg';
import './App.css';
import WebcamInput from './webcam';
import Timer from './timer';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Timer initialMinutes={10}/>
      </header>
      <header>
        <h1> Testing camera</h1>
        <WebcamInput />
      </header>
    </div>
  );
}

export default App;
