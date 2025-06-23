import React, { useRef, useEffect } from "react";

const WebcamInput = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        
        // this is problematic in chrome rip
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
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startVideo();
  }, []);

  const processFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    const analyzeFrame = () => {
        // for debugging -- uncomment to see frame drawn onto the canvas
        // ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // extract image data for analysis
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // TO-DO: copilot suggests doing analysis here (e.g., using TensorFlow.js or OpenCV.js)
        console.log(frameData);

        // Continue processing the next frame
        requestAnimationFrame(analyzeFrame);
      };

      // Start the frame analysis loop
      analyzeFrame();

  };

  return (
    <div>
        {/* export video using the video and autoplay */}
      <video ref={videoRef} width={480} height={480 } autoPlay />

      {/* <canvas ref={canvasRef} width={640} height={480} /> */}
      {/* <button onClick={processFrame}>Analyze Frame</button> */}
    </div>
  );
};

export default WebcamInput;
