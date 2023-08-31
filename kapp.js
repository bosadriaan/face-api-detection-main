const video = document.getElementById("video");
const videoContainer = document.getElementById("video-container");
const MODEL_URI = "/models";

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI),
  faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URI),
])
  .then(playVideo)
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
      audio: false,
    })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err) {
      console.log(err);
    });
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  canvas.willReadFrequently = true;
  videoContainer.appendChild(canvas);
  const canvasSize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, canvasSize);

  setInterval(async () => {
    const detections = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.1 }))
    .withFaceLandmarks();


    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    detectionsDraw(canvas, detections);
  }, 200);
});

function detectionsDraw(canvas, detections) {
  faceapi.draw.drawFaceLandmarks(canvas, detections);
}
