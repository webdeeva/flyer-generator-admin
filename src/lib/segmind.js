import axios from 'axios'

const SEGMIND_API_URL = 'https://api.segmind.com/v1/gpt-image-1-edit'
const SEGMIND_FACESWAP_URL = 'https://api.segmind.com/v1/faceswap-v4'
const SEGMIND_FACESWAP_V3_URL = 'https://api.segmind.com/v1/faceswap-v3'
const SEGMIND_MULTI_FACESWAP_URL = 'https://api.segmind.com/v1/faceswap-v3-multifaceswap'
const SEGMIND_INPAINTING_URL = 'https://api.segmind.com/v1/flux-inpaint'
const SEGMIND_STYLE_TRANSFER_URL = 'https://api.segmind.com/v1/ip-adapter-faceid-v2'
const SEGMIND_API_KEY = import.meta.env.VITE_SEGMIND_API_KEY

export const generateFlyer = async (prompt, imageUrl, options = {}) => {
  const {
    size = 'auto',
    quality = 'auto',
    background = 'opaque',
    outputCompression = 100,
    outputFormat = 'png',
    moderation = 'auto'
  } = options

  try {
    const response = await axios.post(
      SEGMIND_API_URL,
      {
        prompt,
        image_urls: [imageUrl],
        size,
        quality,
        background,
        output_compression: outputCompression,
        output_format: outputFormat,
        moderation
      },
      {
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'blob' // Handle binary data
      }
    )

    return response.data
  } catch (error) {
    console.error('Error generating flyer:', error)
    throw error
  }
}

export const performFaceSwap = async (sourceImage, targetImage, options = {}) => {
  const {
    modelType = 'speed',
    swapType = 'head',
    styleType = 'normal',
    seed = 4208875,
    imageFormat = 'png',
    imageQuality = 90,
    hardware = 'fast',
    base64 = false,
    useStyleAware = false // New option to use style-aware model
  } = options

  // Use style-aware FaceSwap v3 for fantasy/artistic content
  if (useStyleAware) {
    return performStyleAwareFaceSwap(sourceImage, targetImage, options)
  }

  try {
    const response = await axios.post(
      SEGMIND_FACESWAP_URL,
      {
        source_image: sourceImage,
        target_image: targetImage,
        model_type: modelType,
        swap_type: swapType,
        style_type: styleType,
        seed,
        image_format: imageFormat,
        image_quality: imageQuality,
        hardware,
        base64
      },
      {
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      }
    )

    return response.data
  } catch (error) {
    console.error('Error performing face swap:', error)
    throw error
  }
}

export const performStyleAwareFaceSwap = async (sourceImage, targetImage, options = {}) => {
  const {
    inputFacesIndex = '0',
    sourceFacesIndex = '0',
    faceRestore = 'codeformer-v0.1.0.pth', // Face restoration for better blending
    interpolation = 'Bilinear',
    detectionFaceOrder = 'large-small',
    facedetection = 'retinaface_resnet50',
    detectGenderInput = 'no',
    detectGenderSource = 'no',
    faceRestoreWeight = 0.5, // Lower weight for more artistic blend
    imageFormat = 'jpeg',
    imageQuality = 95,
    base64 = false
  } = options

  try {
    const response = await axios.post(
      SEGMIND_FACESWAP_V3_URL,
      {
        source_img: sourceImage,
        target_img: targetImage,
        input_faces_index: inputFacesIndex,
        source_faces_index: sourceFacesIndex,
        face_restore: faceRestore,
        interpolation,
        detection_face_order: detectionFaceOrder,
        facedetection,
        detect_gender_input: detectGenderInput,
        detect_gender_source: detectGenderSource,
        face_restore_weight: faceRestoreWeight,
        image_format: imageFormat,
        image_quality: imageQuality,
        base64
      },
      {
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      }
    )

    return response.data
  } catch (error) {
    console.error('Error performing style-aware face swap:', error)
    throw error
  }
}

export const performMultiFaceSwap = async (sourceImage, targetImage, options = {}) => {
  const {
    inputFacesIndex = '0',
    sourceFacesIndex = '0',
    faceRestore = 'disable',
    interpolation = 'Bilinear',
    detectionFaceOrder = 'left-right',
    facedetection = 'retinaface_resnet50',
    detectGenderInput = 'no',
    detectGenderSource = 'no',
    faceRestoreWeight = 0.75,
    imageFormat = 'jpeg',
    imageQuality = 95,
    base64 = false
  } = options

  try {
    const response = await axios.post(
      SEGMIND_MULTI_FACESWAP_URL,
      {
        source_img: sourceImage,
        target_img: targetImage,
        input_faces_index: inputFacesIndex,
        source_faces_index: sourceFacesIndex,
        face_restore: faceRestore,
        interpolation,
        detection_face_order: detectionFaceOrder,
        facedetection,
        detect_gender_input: detectGenderInput,
        detect_gender_source: detectGenderSource,
        face_restore_weight: faceRestoreWeight,
        image_format: imageFormat,
        image_quality: imageQuality,
        base64
      },
      {
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      }
    )

    return response.data
  } catch (error) {
    console.error('Error performing multi-face swap:', error)
    throw error
  }
}

export const performInpainting = async (imageUrl, maskUrl, prompt, options = {}) => {
  const {
    negative_prompt = '',
    samples = 1,
    scheduler = 'FlowMatchEulerDiscreteScheduler',
    guidance_scale = 3.5,
    num_inference_steps = 24,
    strength = 0.9,
    seed = Math.floor(Math.random() * 1000000),
    base64 = false
  } = options

  try {
    const response = await axios.post(
      SEGMIND_INPAINTING_URL,
      {
        image: imageUrl,
        mask: maskUrl,
        prompt,
        negative_prompt,
        samples,
        scheduler,
        guidance_scale,
        num_inference_steps,
        strength,
        seed,
        base64
      },
      {
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      }
    )

    return response.data
  } catch (error) {
    console.error('Error performing inpainting:', error)
    throw error
  }
}

export const generateStyleTransferFlyer = async (faceImageUrl, styleImageUrl, prompt, options = {}) => {
  const {
    negative_prompt = 'bad quality, low resolution, blurry',
    num_inference_steps = 30,
    guidance_scale = 7.5,
    seed = Math.floor(Math.random() * 1000000),
    samples = 1,
    strength = 0.8,
    scheduler = 'Euler',
    sampler = 'euler_ancestral',
    base64 = false
  } = options

  try {
    const response = await axios.post(
      SEGMIND_STYLE_TRANSFER_URL,
      {
        face_image: faceImageUrl,
        ip_image: styleImageUrl,
        prompt: prompt + ', professional flyer design, high quality, detailed',
        negative_prompt,
        num_inference_steps,
        guidance_scale,
        seed,
        samples,
        strength,
        scheduler,
        sampler,
        base64
      },
      {
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      }
    )

    return response.data
  } catch (error) {
    console.error('Error generating style transfer flyer:', error)
    throw error
  }
}