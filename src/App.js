import './App.css';
import PotatoHeader from './PotatoHeader';

import ObjectDetection from './ModelComponents/ObjectDetection';
import React, { useState, useCallback, useRef } from 'react';

import DistractionDetection from './ModelComponents/DistractionDetection';
import TodoList from './todo';

import StudyBuddy from './ModelComponents/StudyBuddy';
import SpotifyButton from './SpotifyIntegration';
import SpotifyProfile from './SpotifyProfile';


function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studyBuddyChatOpen, setStudyBuddyChatOpen] = useState(false);


  // State to control which character image is shown
  const [characterSrc, setCharacterSrc] = useState(process.env.PUBLIC_URL + '/happyani.png');
  // State to control object detection alert/banner
  const [objectDetectionBanner, setObjectDetectionBanner] = useState(null);
  // Ref for the alert sound
  const alertAudioRef = useRef(null);
  // Track previous distraction state
  const prevDistractionRef = useRef(false);

  // Callback to update characterSrc from ObjectDetection
  const handleDistractionChange = useCallback((distractionDetected, bannerContent) => {
    // Only play sound when going from no distraction to distraction
    if (distractionDetected && !prevDistractionRef.current) {
      setCharacterSrc(process.env.PUBLIC_URL + '/madani.png');
      // Play alert sound
      if (alertAudioRef.current) {
        alertAudioRef.current.currentTime = 0;
        alertAudioRef.current.play();
      }
    } else if (!distractionDetected) {
      setCharacterSrc(process.env.PUBLIC_URL + '/happyani.png');
    }
    setObjectDetectionBanner(bannerContent);
    prevDistractionRef.current = distractionDetected;
  }, []);
  
  return (             
    <div className="App" style={{ position: 'relative', minHeight: '100vh' }}>

      {/* Audio element for distraction alert */}
      <audio ref={alertAudioRef} src={process.env.PUBLIC_URL + '/amogus-distractionalert.mp3'} preload="auto" />
      {/* Render the banner at the top level so it overlays everything */}
      {objectDetectionBanner && React.cloneElement(objectDetectionBanner, {
        style: {
          ...objectDetectionBanner.props.style,
          top: 120, // Move the banner lower (closer to the timer)
        }
      })}

      <StudyBuddy
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        studyBuddyChatOpen={studyBuddyChatOpen}
        setStudyBuddyChatOpen={setStudyBuddyChatOpen}
      />


      {/* Webcam, detection, and Start/Stop button in top left, full logic */}
      {/* Unified distraction detection component */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 20 }}>
        <DistractionDetection onDistractionChange={handleDistractionChange} />
      </div>
      
      {/* PotatoHeader with timer and character */}
      <PotatoHeader characterSrc={characterSrc} objectDetectionBanner={objectDetectionBanner} />

      <TodoList/>
      {/* Spotify playlist embed below the to-do list */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 32 }}>
        <iframe
          style={{ borderRadius: 12 }}
          src="https://open.spotify.com/embed/playlist/6fF3jCxdGRy8GGKdhpIuyO?utm_source=generator"
          width="340"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Playlist"
        ></iframe>
      </div>
      <SpotifyButton/>
      <SpotifyProfile/>
    </div>
  );
}

export default App;