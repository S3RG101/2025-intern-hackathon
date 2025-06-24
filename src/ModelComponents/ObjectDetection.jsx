import React from 'react';
import { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const ObjectDetection = () => {
  const videoRef = useRef(null);
  const [isWebcamStarted, setIsWebcamStarted] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [detectionInterval, setDetectionInterval] = useState();
  const [isCellPhoneDetected, setIsCellPhoneDetected] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [currentDistraction, setCurrentDistraction] = useState('');

  useEffect(() => {
    if (isWebcamStarted) {
      setDetectionInterval(setInterval(predictObject, 500))
    } else {
      if (detectionInterval) {
        clearInterval(detectionInterval)
        setDetectionInterval(null)
      }
    }
  }, [isWebcamStarted])

  const getFunnyMessage = (distractionType) => {
    const messages = {
      phone: [
        "📱 Put that rectangle of distraction down! Your productivity called, it's crying! 😭",
        // "🚨 PHONE ALERT! Your phone is more attractive than your work? That's concerning! 📱💔",
        // "📵 Your phone won't text you back if you ignore your tasks! Focus, human! 🤖",
        // "🔥 Hot take: Your phone is not going anywhere, but your deadlines are! ⏰",
        // "📱 Breaking news: Local person discovers phone is not actually glued to hand! 🗞️"
      ],
      pet: [
        "🐕 Aww, pet therapy session detected! But your work is feeling lonely too! 🥺",
        // "🐱 KITTY ALERT! Your furry overlord demands attention, but so does your boss! 😸💼",
        // "🐾 Pet break activated! Remember: treats for pets, treats for completed tasks! 🍖✅",
        // "🐕 Your dog thinks you're pawsome, but your to-do list thinks otherwise! 🐕‍🦺📝",
        // "🐱 Cat detected! They're judging your productivity levels... and they're not impressed! 😾"
      ],
      people: [
        // "👥 Social butterfly detected! But your work is also people... digital people! 💻👫",
        //"🗣️ CHATTER ALERT! Your mouth is moving but your keyboard isn't! Type faster! ⌨️💨",
        "👫 Multiple humans detected! Are you starting a productivity support group? 🤝📊",
        // "🎪 Is this a meeting or a circus? Either way, get back to work! 🎭💼",
        // "👥 Too many people, not enough productivity! Disperse and focus, humans! 🚶‍♂️🚶‍♀️"
      ]
    };
    
    const typeMessages = messages[distractionType] || messages.phone;
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  };

  const startWebcam = async () => {
    try {
      setIsWebcamStarted(true)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setIsWebcamStarted(false)
      console.error('Error accessing webcam:', error);
    }
  };

  const stopWebcam = () => {
    const video = videoRef.current;

    if (video) {
      const stream = video.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      video.srcObject = null;
      setPredictions([])
      setIsWebcamStarted(false)
    }
  };

  const predictObject = async () => {
    const model = await cocoSsd.load();

    model.detect(videoRef.current).then((predictions) => {
      setPredictions(predictions);
      
      // Check for different types of distractions
      const cellPhoneDetected = predictions.some(prediction =>
        prediction.class.toLowerCase() === 'cell phone'
      );
      
      const petDetected = predictions.some(prediction =>
        ['cat', 'dog'].includes(prediction.class.toLowerCase())
      );
      
      const peopleCount = predictions.filter(prediction =>
        prediction.class.toLowerCase() === 'person'
      ).length;
      
      const multiplePersonDetected = peopleCount > 1;
      
      // Determine distraction type and set message
      let distractionType = '';
      if (cellPhoneDetected) {
        distractionType = 'phone';
      } else if (petDetected) {
        distractionType = 'pet';
      } else if (multiplePersonDetected) {
        distractionType = 'people';
      }
      
      // Determine if any distraction is detected
      const anyDistractionDetected = cellPhoneDetected || petDetected || multiplePersonDetected;
      
      // Update alert visibility and message based on detection
      if (anyDistractionDetected && !showAlert) {
        setCurrentDistraction(getFunnyMessage(distractionType));
      }
      
      setShowAlert(anyDistractionDetected);
      setIsCellPhoneDetected(anyDistractionDetected);
    })

      .catch(err => {
        console.error(err)
      });
  };

return (
    <div className="object-detection">
      {/* Modern Alert Component */}
      {showAlert && (
        <div className="alert-pulse" style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff4757',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(255, 71, 87, 0.3)',
          zIndex: 1000,
          fontSize: '16px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideDown 0.3s ease-out, pulse 2s infinite',
          border: '2px solid #ff3742',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          {currentDistraction}
        </div>
      )}
      
      <div className="buttons">
        <button onClick={isWebcamStarted ? stopWebcam : startWebcam}>{isWebcamStarted ? "Stop" : "Start"} Webcam</button>
      </div>
      <div className="feed">
        {isWebcamStarted ? <video ref={videoRef} autoPlay muted /> : <div />}
      </div>
      {/* Add the tags below to show a horizontal list of predictions to user */}
      {predictions.length > 0 && (
        <div>
          <h3>Detected Objects:</h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '10px'
          }}>
            {predictions.map((prediction, index) => (
              <div key={index} style={{
                backgroundColor: 'black',
                padding: '8px 12px',
                borderRadius: '20px',
                border: '1px solid #ccc',
                fontSize: '14px'
              }}>
                {`${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ObjectDetection;