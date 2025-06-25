import React, { useEffect, useRef, useState } from 'react';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs-core';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

const FaceAttentionDetection = () => {
    const videoRef = useRef(null);
    const [isWebcamStarted, setIsWebcamStarted] = useState(false);
    const [detectionInterval, setDetectionInterval] = useState();
    const [isDistracted, setIsDistracted] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');
    const [detector, setDetector] = useState(null);
    const [modelLoaded, setModelLoaded] = useState(false);

    // Load the model when the component mounts
    useEffect(() => {
        const loadModel = async () => {
            try {
                // Initialize TensorFlow.js and force CPU backend
                await tf.ready();
                
                // Force CPU backend to avoid WebGL issues
                await tf.setBackend('cpu');
                console.log('Using CPU backend');

                // Use TensorFlow.js backend with corrected configuration
                const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
                const detectorConfig = {
                    runtime: 'tfjs',
                    refineLandmarks: false,  // Use simpler model for stability
                    maxFaces: 1
                };
                const detector = await faceLandmarksDetection.createDetector(model, detectorConfig); 

                setDetector(detector);
                setModelLoaded(true);
                console.log("Model loaded successfully with backend:", tf.getBackend());
            } catch (error) {
                console.error("Error loading model:", error);
            }
        };

        loadModel();

        return () => {
            if (detectionInterval) {
                clearInterval(detectionInterval);
            }
        };
    }, []);


    // Set up/clear detection interval when webcam starts/stops
    useEffect(() => {
        if (isWebcamStarted && detector) {
            // Delay the start of detection to ensure video is fully initialized
            const timer = setTimeout(() => {
                console.log("Starting detection interval");
                setDetectionInterval(setInterval(detectFaceAttention, 500));
            }, 1000);
            
            return () => {
                clearTimeout(timer);
                if (detectionInterval) {
                    clearInterval(detectionInterval);
                    setDetectionInterval(null);
                }
            };
        } else {
            if (detectionInterval) {
                clearInterval(detectionInterval);
                setDetectionInterval(null);
            }
        }
    }, [isWebcamStarted, detector]);

    // Add a new effect to monitor video state
    useEffect(() => {
        if (videoRef.current && isWebcamStarted) {
            const checkVideoReady = () => {
                if (videoRef.current.readyState >= 2) {
                    console.log("Video is ready for detection");
                    videoRef.current.removeEventListener('loadeddata', checkVideoReady);
                }
            };
            
            videoRef.current.addEventListener('loadeddata', checkVideoReady);
            
            return () => {
                if (videoRef.current) {
                    videoRef.current.removeEventListener('loadeddata', checkVideoReady);
                }
            };
        }
    }, [isWebcamStarted]);

    const getFunnyMessage = () => {
        const messages = [
        "👀 Eyes on the screen! Your computer feels ignored.",
        "🧠 Distraction Alert! Your focus has gone on vacation.",
        "👁️ Hey! The screen is over here, not over there.",
        "🔍 Searching... searching... for your attention! Have you seen it?",
        "🚨 Distraction detected! Your productivity is plummeting."
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    };

    const startWebcam = async () => {
        try {
            // Set state first, just like in ObjectDetection
            setIsWebcamStarted(true);
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user"
                } 
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Set an event listener to know when the video is actually playing
                videoRef.current.onloadedmetadata = () => {
                    console.log("Video metadata loaded");
                    videoRef.current.play()
                    .then(() => console.log("Video is playing"))
                    .catch(err => console.error("Error playing video:", err));
                };
            }
        } catch (error) {
            // Reset state if there's an error
            setIsWebcamStarted(false);
            console.error('Error accessing webcam:', error);
        }
    };

    const stopWebcam = () => {
        const video = videoRef.current;

        if (video) {
            const stream = video.srcObject;
            if (stream) {
                const tracks = stream.getTracks();
                tracks.forEach((track) => {
                    track.stop();
                });
            }

            video.srcObject = null;
        }
        
        // Clear all states when stopping
        setIsWebcamStarted(false);
        setFaceDetected(false);
        setIsDistracted(false);
        setShowAlert(false);
        setCurrentMessage('');
        
        // Clear detection interval
        if (detectionInterval) {
            clearInterval(detectionInterval);
            setDetectionInterval(null);
        }
    };

    const detectFaceAttention = async () => {
        if (!detector || !videoRef.current) {
            console.log("Detector or video not available");
            return;
        }
        
        if (videoRef.current.readyState < 2) {
            console.log("Video not ready for detection, readyState:", videoRef.current.readyState);
            return;
        }

        try {
            // Ensure the video has dimensions before trying to detect
            if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
                console.log("Video dimensions not available yet");
                return;
            }
            
            console.log("Attempting to detect faces...");
            
            // Use estimateFaces method for MediaPipeFaceMesh
            const predictions = await detector.estimateFaces(videoRef.current);
            console.log("Faces detected:", predictions.length);

            // If no face is detected, the user is not present
            if (predictions.length === 0) {
                console.log("No face detected - user may have left");
                setFaceDetected(false);
                setIsDistracted(true);
                if (!showAlert) {
                    setCurrentMessage("¡No te veo! ¿Te fuiste a algún lado?");
                    setShowAlert(true);
                }
                return;
            }

            // Face detected, clear any previous "no face" alerts
            setFaceDetected(true);
            
            const face = predictions[0];
            console.log("Face detection structure:", face);
            
            // Check if we have a bounding box
            if (face.box) {
                const box = face.box;
                console.log("Using face box:", box);
                
                // Check if the face is in the center of the image
                const videoWidth = videoRef.current.videoWidth;
                const videoHeight = videoRef.current.videoHeight;
                
                const faceX = box.xMin + (box.width / 2);
                const faceY = box.yMin + (box.height / 2);
                
                // Calculate the relative position of the face in the image (0-1)
                const relativeX = faceX / videoWidth;
                const relativeY = faceY / videoHeight;
                
                // If the face is too far from the center, we consider it distracted
                const centerThresholdX = 0.4;
                const centerThresholdY = 0.4;
                
                const isFaceCentered = 
                    Math.abs(relativeX - 0.5) < centerThresholdX && 
                    Math.abs(relativeY - 0.5) < centerThresholdY;
                
                // Also check if the face is too small (far from the camera)
                const minFaceSizeRatio = 0.1;
                const faceWidthRatio = box.width / videoWidth;
                const faceHeightRatio = box.height / videoHeight;
                
                const isFaceSizeSufficient = 
                    faceWidthRatio > minFaceSizeRatio || 
                    faceHeightRatio > minFaceSizeRatio;
                
                // Determine if the user is distracted
                const isUserDistracted = !isFaceCentered || !isFaceSizeSufficient;
                
                setIsDistracted(isUserDistracted);
                
                // Show an alert if the user is distracted
                if (isUserDistracted && !showAlert) {
                    setCurrentMessage(getFunnyMessage());
                    setShowAlert(true);
                } else if (!isUserDistracted) {
                    setShowAlert(false);
                }
            } else if (face.keypoints && face.keypoints.length > 0) {
                // Fallback: calculate bounding box from keypoints if box is not available
                const keypoints = face.keypoints;
                
                // Filter out null, undefined, and NaN keypoints
                const validKeypoints = keypoints.filter(point => 
                    point.x !== null && 
                    point.y !== null && 
                    point.x !== undefined && 
                    point.y !== undefined && 
                    !isNaN(point.x) && 
                    !isNaN(point.y) &&
                    isFinite(point.x) &&
                    isFinite(point.y)
                );
                
                console.log(`Valid keypoints: ${validKeypoints.length} out of ${keypoints.length}`);
                
                if (validKeypoints.length === 0) {
                    console.log("No valid keypoints found - treating as no face detected");
                    setFaceDetected(false);
                    setIsDistracted(true);
                    if (!showAlert) {
                        setCurrentMessage("¡No puedo detectar tu rostro correctamente!");
                        setShowAlert(true);
                    }
                    return;
                }
                
                // Find min/max coordinates to create bounding box
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                
                validKeypoints.forEach(point => {
                    if (point.x < minX) minX = point.x;
                    if (point.x > maxX) maxX = point.x;
                    if (point.y < minY) minY = point.y;
                    if (point.y > maxY) maxY = point.y;
                });
                
                // Verify that we have valid bounds
                if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
                    console.log("Invalid bounding box coordinates");
                    setFaceDetected(false);
                    setIsDistracted(true);
                    if (!showAlert) {
                        setCurrentMessage("¡Error en la detección del rostro!");
                        setShowAlert(true);
                    }
                    return;
                }
                
                const box = {
                    xMin: minX,
                    yMin: minY,
                    width: maxX - minX,
                    height: maxY - minY
                };
                
                console.log("Calculated face box from keypoints:", box);
                
                // Same logic as above for center detection
                const videoWidth = videoRef.current.videoWidth;
                const videoHeight = videoRef.current.videoHeight;
                
                const faceX = box.xMin + (box.width / 2);
                const faceY = box.yMin + (box.height / 2);
                
                const relativeX = faceX / videoWidth;
                const relativeY = faceY / videoHeight;
                
                const centerThresholdX = 0.4;
                const centerThresholdY = 0.4;
                
                const isFaceCentered = 
                    Math.abs(relativeX - 0.5) < centerThresholdX && 
                    Math.abs(relativeY - 0.5) < centerThresholdY;
                
                const minFaceSizeRatio = 0.1;
                const faceWidthRatio = box.width / videoWidth;
                const faceHeightRatio = box.height / videoHeight;
                
                const isFaceSizeSufficient = 
                    faceWidthRatio > minFaceSizeRatio || 
                    faceHeightRatio > minFaceSizeRatio;
                
                const isUserDistracted = !isFaceCentered || !isFaceSizeSufficient;
                
                setIsDistracted(isUserDistracted);
                
                if (isUserDistracted && !showAlert) {
                    setCurrentMessage(getFunnyMessage());
                    setShowAlert(true);
                } else if (!isUserDistracted) {
                    setShowAlert(false);
                }
            } else {
                console.log("No usable face data found - treating as no face detected");
                setFaceDetected(false);
                setIsDistracted(true);
                if (!showAlert) {
                    setCurrentMessage("¡No puedo detectar tu rostro!");
                    setShowAlert(true);
                }
            }
        } catch (error) {
            console.error('Error detecting face:', error);
            console.log("Error details:", error.message, error.stack);
        }
    };

    return (
        <div className="face-attention-detection">
        {/* Alert for when distraction is detected */}
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
            {currentMessage}
            </div>
        )}
        
        <div className="buttons">
            <button onClick={isWebcamStarted ? stopWebcam : startWebcam}>
            {isWebcamStarted ? "Stop" : "Start"} Attention Detection
            </button>
            {!modelLoaded && <span style={{marginLeft: '10px', color: '#ff4757'}}>Loading model, please wait...</span>}
        </div>
        
        <div className="feed">
            {/* Simplify video display like in ObjectDetection */}
            {isWebcamStarted ? 
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    muted 
                    style={{
                        display: "block",
                        margin: "0 auto",
                        width: "640px",
                        height: "480px",
                        borderRadius: '8px',
                        border: isDistracted ? '3px solid #ff4757' : '3px solid #2ed573'
                    }} 
                /> 
                : 
                <div className="placeholder" style={{
                    width: '640px',
                    height: '480px',
                    backgroundColor: '#f1f2f6',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a4b0be',
                    fontSize: '18px',
                    margin: "0 auto"
                }}>
                    Click "Start Attention Detection" to begin
                </div>
            }
        </div>
        
        {/* Detection status */}
        {isWebcamStarted && (
            <div className="detection-status" style={{
            marginTop: '10px',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: faceDetected ? '#f5f6fa' : '#ffe3e3',
            color: '#2f3542'
            }}>
            <p>Status: {faceDetected ? 'Face detected' : 'No face detected'}</p>
            {faceDetected && (
                <p>Attention: {isDistracted ? '❌ Distracted' : '✅ Focused'}</p>
            )}
            </div>
        )}
        </div>
    );
};

export default FaceAttentionDetection;