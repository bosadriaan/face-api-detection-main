const video = document.getElementById("video");
const videoContainer = document.getElementById("video-container");
const MODEL_URI = "/models";

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI),
  faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URI)
]).then(playVideo)
  .catch((err) => {
    console.log(err);
  });

function playVideo() {
  if (!navigator.mediaDevices) {
    console.error("mediaDevices not supported");
    return;
  }
  navigator.mediaDevices
    .getUserMedia({
      video: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 360, ideal: 720, max: 1080 },
      },
      audio: false
    })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err) {
      console.log(err);
    });
}

function isLookingAtCamera(landmarks) {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();

  const noseCenter = {
    x: (nose[3].x + nose[4].x) / 2,
    y: (nose[3].y + nose[4].y) / 2
  };

  const eyesCenter = {
    x: (leftEye[0].x + rightEye[3].x) / 2,
    y: (leftEye[0].y + rightEye[3].y) / 2
  };

  const tolerance = 5;
  return (Math.abs(noseCenter.x - eyesCenter.x) < tolerance && 
          Math.abs(noseCenter.y - eyesCenter.y) < tolerance);
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  canvas.willReadFrequently = true;
  videoContainer.appendChild(canvas);

  const canvasSize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, canvasSize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    const resizedDetections = faceapi.resizeResults(detections, canvasSize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    // Check if face is looking at the camera
    if (detections && detections.length > 0) {
      const landmarks = detections[0].landmarks;
      const lookingAtCamera = isLookingAtCamera(landmarks);

      const indicatorElem = document.getElementById("indicator");
      if (lookingAtCamera) {
        indicatorElem.innerText = "Looking at the camera!";
        indicatorElem.style.color = "green";
      } else {
        indicatorElem.innerText = "Not looking at the camera.";
        indicatorElem.style.color = "red";
      }
    }

  }, 10);
});
