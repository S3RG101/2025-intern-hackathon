import './App.css';
import PotatoHeader from './PotatoHeader';
import ObjectDetection from './ModelComponents/ObjectDetection';
import FaceAttentionDetection from './ModelComponents/FaceAttentionDetection';
import TodoList from './todo';

function App() {
  // State to control which character image is shown
  const [characterSrc, setCharacterSrc] = useState(process.env.PUBLIC_URL + '/happyani.png');
  // State to control object detection alert/banner
  const [objectDetectionBanner, setObjectDetectionBanner] = useState(null);

  // Callback to update characterSrc from ObjectDetection
  const handleDistractionChange = useCallback((distractionDetected, bannerContent) => {
    if (distractionDetected) {
      setCharacterSrc(process.env.PUBLIC_URL + '/madani.png');
    } else {
      setCharacterSrc(process.env.PUBLIC_URL + '/happyani.png');
    }
    setObjectDetectionBanner(bannerContent);
  }, []);
  
  return (
    <div className="App" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Webcam, detection, and Start/Stop button in top left, full logic */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 20 }}>
        <ObjectDetection onDistractionChange={handleDistractionChange} />
      </div>
      {/* PotatoHeader with timer and character */}
      <PotatoHeader characterSrc={characterSrc} objectDetectionBanner={objectDetectionBanner} />
    </div>
  );
}

export default App;
