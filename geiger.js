const video = document.getElementById("video");
const MODEL_URI = "/models";
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playTick() {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'square';  // square wave
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // value in hertz
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.05);  // stops the sound after 50ms
}


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
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
      .withFaceLandmarks();

    let counter = 0;
    for (let detection of detections) {
      const landmarks = detection.landmarks;
      const noseTip = landmarks.getNose()[2];
      const leftEye = landmarks.getLeftEye()[0];
      const rightEye = landmarks.getRightEye()[3];

      if (noseTip.x > leftEye.x && noseTip.x < rightEye.x) {
        counter++;
      }
    }

    if (counter > 0) {
      console.log(`${counter} people are likely looking at the camera!`);
      playTick();
    }
  }, 200);
});
