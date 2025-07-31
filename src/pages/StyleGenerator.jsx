import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Upload, Image, AlertCircle, Loader, ArrowRight, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateStyleTransferFlyer, performFaceSwap } from '../lib/segmind'
import { detectFaces } from '../lib/faceDetection'
import PromptConfigurator from '../components/PromptConfigurator'

const StyleGenerator = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // User photo state
  const [userImage, setUserImage] = useState(null)
  const [userImageUrl, setUserImageUrl] = useState('')
  const [faceDetectionResult, setFaceDetectionResult] = useState(null)
  
  // Style reference state
  const [styleImage, setStyleImage] = useState(null)
  const [styleImageUrl, setStyleImageUrl] = useState('')
  
  // Form inputs
  const [customPrompt, setCustomPrompt] = useState('')
  const [quality, setQuality] = useState('auto')
  const [useFaceSwap, setUseFaceSwap] = useState(true)

  const handleUserImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUserImage(file)
    
    // Create object URL for display
    const objectUrl = URL.createObjectURL(file)
    setUserImageUrl(objectUrl)
    
    // Detect faces using the file blob
    try {
      const result = await detectFaces(file)
      setFaceDetectionResult(result)
    } catch (err) {
      console.error('Face detection failed:', err)
    }
  }

  const handleStyleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setStyleImage(file)
      setStyleImageUrl(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!userImage || !styleImage) {
      setError('Please upload both your photo and a style reference')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Upload images to Supabase storage
      const userImageName = `style-user-${user.id}-${Date.now()}.${userImage.name.split('.').pop()}`
      const styleImageName = `style-ref-${user.id}-${Date.now()}.${styleImage.name.split('.').pop()}`
      
      const { data: userUpload, error: userError } = await supabase.storage
        .from('user-images')
        .upload(userImageName, userImage)
        
      if (userError) throw userError
      
      const { data: styleUpload, error: styleError } = await supabase.storage
        .from('user-images')
        .upload(styleImageName, styleImage)
        
      if (styleError) throw styleError
      
      // Get public URLs
      const { data: { publicUrl: userPublicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(userImageName)
        
      const { data: { publicUrl: stylePublicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(styleImageName)
      
      // Generate prompt with custom configurator text
      const basePrompt = 'Professional flyer design in the exact style of the reference image.'
      const prompt = `${basePrompt} ${customPrompt}`.trim()
      
      // Call style transfer API
      const result = await generateStyleTransferFlyer(userPublicUrl, stylePublicUrl, prompt)
      
      let finalImageUrl = ''
      
      // Handle face swap if enabled and face detected
      if (useFaceSwap && faceDetectionResult?.hasOneFace) {
        try {
          const faceSwapResult = await performFaceSwap(userPublicUrl, result, {
            styleAware: true,
            faceRestoreWeight: 0.5
          })
          
          if (faceSwapResult instanceof Blob) {
            const faceSwapName = `style-final-${user.id}-${Date.now()}.png`
            const { data: faceSwapUpload, error: faceSwapError } = await supabase.storage
              .from('generated-flyers')
              .upload(faceSwapName, faceSwapResult)
              
            if (!faceSwapError) {
              const { data: { publicUrl } } = supabase.storage
                .from('generated-flyers')
                .getPublicUrl(faceSwapName)
              finalImageUrl = publicUrl
            }
          }
        } catch (faceSwapError) {
          console.warn('Face swap failed, using original result:', faceSwapError)
        }
      }
      
      // Upload final result if no face swap
      if (!finalImageUrl && result instanceof Blob) {
        const resultName = `style-result-${user.id}-${Date.now()}.png`
        const { data: resultUpload, error: resultError } = await supabase.storage
          .from('generated-flyers')
          .upload(resultName, result)
          
        if (!resultError) {
          const { data: { publicUrl } } = supabase.storage
            .from('generated-flyers')
            .getPublicUrl(resultName)
          finalImageUrl = publicUrl
        }
      }
      
      // Save to database
      await supabase.from('generations').insert({
        user_id: user.id,
        image_url: finalImageUrl,
        prompt_text: prompt,
        generation_type: 'style_transfer',
        metadata: {
          style_image_url: stylePublicUrl,
          user_image_url: userPublicUrl,
          custom_prompt: customPrompt,
          quality: quality
        }
      })
      
      // Navigate to result page
      navigate('/generated', {
        state: {
          imageUrl: finalImageUrl,
          prompt: prompt,
          isStyleTransfer: true
        }
      })
      
    } catch (err) {
      console.error('Generation error:', err)
      setError('Failed to generate flyer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Style-Based Flyer Generator</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload a reference flyer or image style you like, add your photo and information, 
            and we'll create a custom flyer matching that style!
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Image Uploads */}
          <div className="space-y-6">
            {/* User Photo Upload */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">1. Upload Your Photo</h2>
              
              <div className="space-y-4">
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer">
                    {userImageUrl ? (
                      <div className="relative">
                        <img
                          src={userImageUrl}
                          alt="Your photo"
                          className="max-w-full max-h-64 mx-auto rounded"
                        />
                        <button
                          onClick={() => {
                            setUserImage(null)
                            setUserImageUrl('')
                            setFaceDetectionResult(null)
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600">Click to upload your photo</p>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUserImageUpload}
                      className="hidden"
                    />
                  </div>
                </label>

                {faceDetectionResult && (
                  <div className="flex items-center space-x-2 text-sm">
                    {faceDetectionResult.hasOneFace ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-700">Face detected - face swap available</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">No face detected - face swap unavailable</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Style Reference Upload */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">2. Upload Style Reference</h2>
              
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer">
                  {styleImageUrl ? (
                    <div className="relative">
                      <img
                        src={styleImageUrl}
                        alt="Style reference"
                        className="max-w-full max-h-64 mx-auto rounded"
                      />
                      <button
                        onClick={() => {
                          setStyleImage(null)
                          setStyleImageUrl('')
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Image className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600">Upload a flyer or image style you like</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStyleImageUpload}
                    className="hidden"
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">3. Customize Your Flyer</h2>
              
              {/* Prompt Configurator */}
              <PromptConfigurator
                basePrompt={{ title: 'Style Transfer' }}
                customPrompt={customPrompt}
                setCustomPrompt={setCustomPrompt}
                quality={quality}
                setQuality={setQuality}
              />
              
              {/* Face Swap Option */}
              {faceDetectionResult?.hasOneFace && (
                <div className="mt-4 pt-4 border-t">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={useFaceSwap}
                      onChange={(e) => setUseFaceSwap(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      Apply face swap to match the style better
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !userImage || !styleImage}
              className="w-full py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating your styled flyer...</span>
                </>
              ) : (
                <>
                  <span>Generate Styled Flyer</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Tips */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Tips for best results:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use a clear, front-facing photo of yourself</li>
                <li>• Choose a style reference with clear design elements</li>
                <li>• The AI will match colors, layout, and design style</li>
                <li>• Text placement will adapt to the reference style</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StyleGenerator