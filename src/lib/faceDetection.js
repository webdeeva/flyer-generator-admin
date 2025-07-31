import * as faceapi from '@vladmandic/face-api'

let modelsLoaded = false

// Load face detection models
export const loadModels = async () => {
  if (modelsLoaded) return
  
  try {
    // Load models from CDN
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model'
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ])
    
    modelsLoaded = true
    console.log('Face detection models loaded successfully')
  } catch (error) {
    console.error('Error loading face detection models:', error)
    throw error
  }
}

// Detect faces in an image
export const detectFaces = async (input) => {
  if (!modelsLoaded) {
    await loadModels()
  }
  
  try {
    let imageElement = input
    
    // If input is a File/Blob, convert to image element
    if (input instanceof File || input instanceof Blob) {
      const img = new Image()
      const url = URL.createObjectURL(input)
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })
      
      imageElement = img
      URL.revokeObjectURL(url) // Clean up
    } else if (typeof input === 'string' && !input.startsWith('data:')) {
      // If it's a URL string (not data URL), create image element
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = input
      })
      
      imageElement = img
    }
    
    // Detect all faces with landmarks
    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
    
    return {
      faceCount: detections.length,
      hasFace: detections.length > 0,
      hasOneFace: detections.length === 1,
      hasMultipleFaces: detections.length > 1,
      detections
    }
  } catch (error) {
    console.error('Error detecting faces:', error)
    return {
      faceCount: 0,
      hasFace: false,
      hasOneFace: false,
      hasMultipleFaces: false,
      detections: []
    }
  }
}

// Create an image element from a data URL
export const createImageElement = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}