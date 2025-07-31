import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { generateFlyer, performFaceSwap, performMultiFaceSwap } from '../lib/segmind'
import { detectFaces, createImageElement, loadModels } from '../lib/faceDetection'
import { Upload, Wand2, Loader, AlertCircle } from 'lucide-react'
import PromptConfigurator from '../components/PromptConfigurator'

const Generator = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [basePrompts, setBasePrompts] = useState([])
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [error, setError] = useState(null)
  const [quality, setQuality] = useState('auto')
  const [hasRealFace, setHasRealFace] = useState(false)
  const [showFaceOption, setShowFaceOption] = useState(false)
  const [faceDetectionResult, setFaceDetectionResult] = useState(null)
  const [isDetectingFace, setIsDetectingFace] = useState(false)
  const [faceSwapStyle, setFaceSwapStyle] = useState('auto') // 'auto', 'realistic', 'artistic'

  useEffect(() => {
    fetchBasePrompts()
    
    // Check if returning from generated page with previous prompt
    if (location.state?.previousPrompt) {
      setCustomPrompt(location.state.previousPrompt)
      // Find and select the previous prompt if available
      if (location.state.previousPromptId) {
        const prompt = basePrompts.find(p => p.id === location.state.previousPromptId)
        if (prompt) setSelectedPrompt(prompt)
      }
    }
  }, [location.state, basePrompts])

  const fetchBasePrompts = async () => {
    const { data, error } = await supabase
      .from('base_prompts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (data) {
      setBasePrompts(data)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadedImage(file)
      const reader = new FileReader()
      reader.onloadend = async () => {
        setImagePreview(reader.result)
        setShowFaceOption(true)
        
        // Perform face detection
        setIsDetectingFace(true)
        setFaceDetectionResult(null)
        try {
          // Preload models if not loaded
          await loadModels()
          
          // Create image element and detect faces
          const img = await createImageElement(reader.result)
          const detection = await detectFaces(img)
          
          setFaceDetectionResult(detection)
          
          // Auto-check if exactly one face is detected
          if (detection.hasOneFace) {
            setHasRealFace(true)
          } else {
            setHasRealFace(false)
          }
        } catch (error) {
          console.error('Face detection error:', error)
          // Don't block the user if face detection fails
        } finally {
          setIsDetectingFace(false)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImageToSupabase = async (file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    
    // Use admin client for storage operations (dev only!)
    const { data, error } = await supabaseAdmin.storage
      .from('user-uploads')
      .upload(fileName, file)

    if (error) {
      console.error('Storage error:', error)
      throw new Error(`Storage error: ${error.message}. Please ensure the 'user-uploads' bucket exists in Supabase.`)
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('user-uploads')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleGenerate = async () => {
    if (!uploadedImage || !selectedPrompt) {
      setError('Please upload an image and select a prompt')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      console.log('Starting generation process...')
      
      // Step 1: Upload image
      let imageUrl;
      try {
        imageUrl = await uploadImageToSupabase(uploadedImage)
        console.log('Image uploaded successfully:', imageUrl)
      } catch (uploadError) {
        console.error('Failed to upload image:', uploadError)
        setError(`Failed to upload image: ${uploadError.message}`)
        return
      }

      // Step 2: Generate flyer
      // Update prompt to preserve faces
      const facePreservingPrompt = selectedPrompt.prompt_template.replace(
        'Feature a large, confident central close-up of the subject',
        'Feature a large, confident central close-up of the subject, preserving the exact facial features and characteristics from the uploaded image'
      )
      const finalPrompt = facePreservingPrompt + ' ' + customPrompt
      console.log('Calling Segmind API with prompt:', finalPrompt)
      
      const result = await generateFlyer(finalPrompt, imageUrl, { quality })
      console.log('Segmind API response:', result)
      
      // Convert blob to object URL for display
      let displayImageUrl = ''
      if (result instanceof Blob) {
        displayImageUrl = URL.createObjectURL(result)
        console.log('Created object URL for display:', displayImageUrl)
        setGeneratedImage(displayImageUrl)
      } else if (typeof result === 'string') {
        displayImageUrl = result
        setGeneratedImage(result)
      } else if (result.image) {
        displayImageUrl = result.image
        setGeneratedImage(result.image)
      }

      // Step 3: Save to database
      // Store the generated image URL
      let resultUrl = '';
      if (result instanceof Blob) {
        // For blob, we'll need to upload it to Supabase storage
        const fileExt = 'png'
        const fileName = `generated-${user.id}-${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('generated-flyers')
          .upload(fileName, result)
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('generated-flyers')
            .getPublicUrl(fileName)
          resultUrl = publicUrl
        }
      } else if (typeof result === 'string') {
        resultUrl = result
      } else if (result.image) {
        resultUrl = result.image
      }
      
      // Step 2.5: Perform face swap if requested and prompt is realistic or has fantasy elements
      if (hasRealFace && (selectedPrompt.category === 'realistic' || selectedPrompt.category === 'fantasy' || selectedPrompt.category === 'bold')) {
        console.log('Performing face swap...')
        
        // Determine if we should use style-aware face swap
        let useStyleAware = false
        
        if (faceSwapStyle === 'artistic') {
          useStyleAware = true
        } else if (faceSwapStyle === 'realistic') {
          useStyleAware = false
        } else { // auto mode
          useStyleAware = selectedPrompt.category === 'fantasy' || selectedPrompt.category === 'bold' || 
                         finalPrompt.toLowerCase().includes('fantasy') || 
                         finalPrompt.toLowerCase().includes('artistic') ||
                         finalPrompt.toLowerCase().includes('bold') ||
                         finalPrompt.toLowerCase().includes('vibrant')
        }
        
        try {
          let faceSwapResult
          
          // Use multi-face swap if multiple faces detected
          if (faceDetectionResult && faceDetectionResult.hasMultipleFaces) {
            console.log(`Performing multi-face swap for ${faceDetectionResult.faceCount} faces...`)
            // Create face indices based on face count (e.g., "0,1,2" for 3 faces)
            const faceIndices = Array.from({ length: faceDetectionResult.faceCount }, (_, i) => i).join(',')
            faceSwapResult = await performMultiFaceSwap(imageUrl, resultUrl || displayImageUrl, {
              inputFacesIndex: faceIndices,
              sourceFacesIndex: faceIndices
            })
          } else {
            // Single face swap - use style-aware for artistic content
            if (useStyleAware) {
              console.log('Using style-aware face swap for artistic content...')
              faceSwapResult = await performFaceSwap(imageUrl, resultUrl || displayImageUrl, {
                useStyleAware: true,
                faceRestoreWeight: 0.4 // Lower weight for more artistic blending
              })
            } else {
              // Regular face swap for realistic content
              faceSwapResult = await performFaceSwap(imageUrl, resultUrl || displayImageUrl)
            }
          }
          
          // Upload face-swapped image
          if (faceSwapResult instanceof Blob) {
            const faceSwapFileName = `faceswap-${user.id}-${Date.now()}.png`
            const { data: faceSwapUpload, error: faceSwapError } = await supabaseAdmin.storage
              .from('generated-flyers')
              .upload(faceSwapFileName, faceSwapResult)
            
            if (!faceSwapError) {
              const { data: { publicUrl } } = supabaseAdmin.storage
                .from('generated-flyers')
                .getPublicUrl(faceSwapFileName)
              resultUrl = publicUrl
              displayImageUrl = URL.createObjectURL(faceSwapResult)
              setGeneratedImage(displayImageUrl)
            }
          }
        } catch (faceSwapError) {
          console.warn('Face swap failed, using original result:', faceSwapError)
          // Continue with original result if face swap fails
        }
      }
      
      // Clean metadata to remove any null characters or problematic Unicode
      const cleanMetadata = {
        timestamp: new Date().toISOString(),
        prompt: finalPrompt
      }
      
      const { data: genData, error: genError } = await supabase.from('generations').insert({
        user_id: user.id,
        base_prompt_id: selectedPrompt.id,
        custom_prompt: finalPrompt,
        image_url: imageUrl,
        result_url: resultUrl,
        metadata: cleanMetadata
      }).select()

      if (genError) {
        console.error('Failed to save generation:', genError)
        setError(`Failed to save generation: ${genError.message}`)
        return
      }

      // Step 4: Update usage
      try {
        const { error: rpcError } = await supabase.rpc('increment_usage', user.id)
        if (rpcError) {
          console.warn('Failed to update usage:', rpcError)
          // Don't throw error here - usage tracking shouldn't block the main functionality
        }
      } catch (usageError) {
        console.warn('Usage tracking error:', usageError)
        // Continue execution - usage tracking is non-critical
      }
      
      console.log('Generation completed successfully!')
      
      // Navigate to the generated flyer page
      navigate('/generated', {
        state: {
          imageUrl: displayImageUrl || resultUrl,
          prompt: finalPrompt,
          promptId: selectedPrompt.id
        }
      })
    } catch (err) {
      setError(`Failed to generate flyer: ${err.message}`)
      console.error('Generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Generate New Flyer</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Upload Your Image</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Uploaded"
                    className="max-h-64 mx-auto rounded"
                  />
                  <button
                    onClick={() => {
                      setUploadedImage(null)
                      setImagePreview(null)
                      setShowFaceOption(false)
                      setHasRealFace(false)
                      setFaceDetectionResult(null)
                      setIsDetectingFace(false)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Choose file or drag and drop
                  </label>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                </>
              )}
            </div>
            
            {/* Face detection option */}
            {showFaceOption && imagePreview && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg space-y-3">
                {isDetectingFace ? (
                  <div className="flex items-center space-x-2 text-sm text-blue-700">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Detecting faces...</span>
                  </div>
                ) : faceDetectionResult ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      {faceDetectionResult.hasOneFace ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700">1 face detected</span>
                        </>
                      ) : faceDetectionResult.hasMultipleFaces ? (
                        <>
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-orange-700">
                            {faceDetectionResult.faceCount} faces detected - multi-face swap available
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">No faces detected</span>
                        </>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={hasRealFace}
                          onChange={(e) => setHasRealFace(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">
                          Use face preservation for realistic flyers
                          {faceDetectionResult.hasOneFace && " (recommended)"}
                          {faceDetectionResult.hasMultipleFaces && " (will swap all faces)"}
                        </span>
                      </label>
                      
                      {hasRealFace && (
                        <div className="ml-7 flex items-center space-x-3">
                          <label className="text-xs text-gray-600">Style:</label>
                          <select
                            value={faceSwapStyle}
                            onChange={(e) => setFaceSwapStyle(e.target.value)}
                            className="text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="auto">Auto-detect</option>
                            <option value="realistic">Realistic</option>
                            <option value="artistic">Artistic blend</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">2. Select Base Prompt</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {basePrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  onClick={() => setSelectedPrompt(prompt)}
                  className={`p-3 border rounded-lg cursor-pointer transition ${
                    selectedPrompt?.id === prompt.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-medium">{prompt.title}</h4>
                  <p className="text-sm text-gray-600">{prompt.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedPrompt && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">3. Customize Your Prompt</h3>
            <PromptConfigurator
              basePrompt={selectedPrompt}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              quality={quality}
              setQuality={setQuality}
            />
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !uploadedImage || !selectedPrompt}
          className={`mt-6 w-full py-3 rounded-lg font-medium flex items-center justify-center ${
            isGenerating || !uploadedImage || !selectedPrompt
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Flyer
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default Generator