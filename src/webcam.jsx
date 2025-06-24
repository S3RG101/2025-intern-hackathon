import React, { useRef, useEffect, useState } from "react";
import * as tf from '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';

const WebcamInput = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/face_models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log("Face detection models loaded");
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        videoRef.current.srcObject = stream;
        
        // does not work in chrome browser
        // videoRef.current.play();

        // Handle the play() promise
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Video playback started successfully.");
            })
            .catch((error) => {
              console.error("Error starting video playback:", error);
            });

        }
      }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    startVideo();
  }, []);

  useEffect(() => {
    if (videoRef.current && canvasRef.current && modelsLoaded) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: 180, height: 135 };
      faceapi.matchDimensions(canvas, displaySize);
      let previousDetection = null;

      const detectFaces = async () => {
        if (video.paused || video.ended || !video.readyState) {
          requestAnimationFrame(detectFaces);
          return;
        }
        const detections = await faceapi
          .detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.5
            })
          )
          .withFaceLandmarks();
        // Smoothing: use previous detection if none found
        const smoothedDetections = (previousDetection && detections.length === 0)
          ? previousDetection
          : detections;
        if (detections.length > 0) {
          previousDetection = detections;
        }
        const resizedDetections = faceapi.resizeResults(smoothedDetections, displaySize);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resizedDetections.forEach(detection => {
          applyFilter(ctx, detection);
        });
        requestAnimationFrame(detectFaces);
      };

      video.onloadeddata = () => {
        requestAnimationFrame(detectFaces);
      };
      if (!video.paused) {
        requestAnimationFrame(detectFaces);
      }
    }
  }, [modelsLoaded]);

  // Function to apply AR filter (simple sunglasses)
  const applyFilter = (ctx, detection) => {
    if (!detection.landmarks) return;
    const landmarks = detection.landmarks;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    if (leftEye.length > 0 && rightEye.length > 0) {
      const eyeWidth = rightEye[0].x - leftEye[3].x;
      const glassesWidth = eyeWidth * 1.5;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        leftEye[0].x - glassesWidth * 0.1,
        Math.min(leftEye[0].y, rightEye[0].y) - 5,
        glassesWidth,
        20
      );
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(leftEye[0].x - glassesWidth * 0.1, leftEye[0].y + 5);
      ctx.lineTo(leftEye[0].x - glassesWidth * 0.25, leftEye[0].y + 15);
      ctx.moveTo(rightEye[3].x + glassesWidth * 0.1, rightEye[3].y + 5);
      ctx.lineTo(rightEye[3].x + glassesWidth * 0.25, rightEye[3].y + 15);
      ctx.stroke();
    }
  };

  return (
    <div className="camera-container">
      <video ref={videoRef} width={180} height={135} autoPlay muted style={{ width: '100%', height: '100%' }} />
      <canvas ref={canvasRef} width={180} height={135} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%' }} />
    </div>
  );
};

export default WebcamInput;
