import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { performInpainting } from '../lib/segmind'
import { Upload, Brush, Eraser, Download, Save, Undo, Redo, Loader, ZoomIn, ZoomOut } from 'lucide-react'

const Inpainting = () => {
  const { user } = useUser()
  const location = useLocation()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const maskCanvasRef = useRef(null)
  const [originalImage, setOriginalImage] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(20)
  const [brushMode, setBrushMode] = useState('draw') // 'draw' or 'erase'
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [isInpainting, setIsInpainting] = useState(false)
  const [inpaintedImage, setInpaintedImage] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [zoom, setZoom] = useState(1)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [showCursor, setShowCursor] = useState(false)

  useEffect(() => {
    // Check if coming from generated page with an image
    if (location.state?.imageUrl) {
      setImageUrl(location.state.imageUrl)
      loadImage(location.state.imageUrl)
    }
  }, [location.state])

  const loadImage = (url) => {
    console.log('Loading image:', url)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      console.log('Image loaded successfully:', img.width, 'x', img.height)
      setOriginalImage(img)
      setImageLoaded(true)
      initializeCanvases(img)
    }
    img.onerror = (e) => {
      console.error('Failed to load image:', e)
      setError('Failed to load image. Please try uploading again.')
      setImageLoaded(false)
    }
    img.src = url
  }

  const initializeCanvases = (img) => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const canvas = canvasRef.current
      const maskCanvas = maskCanvasRef.current
      
      if (!canvas || !maskCanvas) {
        console.error('Canvas refs not available')
        return
      }

      console.log('Initializing canvases with dimensions:', img.width, 'x', img.height)

      // Set canvas dimensions to match image
      canvas.width = img.width
      canvas.height = img.height
      maskCanvas.width = img.width
      maskCanvas.height = img.height

      // Draw original image
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      // Clear mask canvas
      const maskCtx = maskCanvas.getContext('2d')
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
      
      // Save initial state
      saveToHistory()
    }, 100)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Reset states
      setError(null)
      setImageLoaded(false)
      setInpaintedImage(null)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target.result
        setImageUrl(url)
        loadImage(url)
      }
      reader.onerror = () => {
        setError('Failed to read file. Please try again.')
      }
      reader.readAsDataURL(file)
    }
  }

  const startDrawing = (e) => {
    setIsDrawing(true)
    const rect = maskCanvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom
    draw(x, y)
  }

  const draw = (x, y) => {
    if (!maskCanvasRef.current) return

    const ctx = maskCanvasRef.current.getContext('2d')
    
    if (brushMode === 'draw') {
      // Draw mode - add to mask
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'
      ctx.lineWidth = 2
    } else {
      // Erase mode - remove from mask
      ctx.globalCompositeOperation = 'destination-out'
    }
    
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
    
    // Add outline in draw mode for better visibility
    if (brushMode === 'draw') {
      ctx.stroke()
    }
  }

  const handleMouseMove = (e) => {
    const rect = maskCanvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom
    
    // Update cursor position for visual feedback
    setCursorPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    
    if (isDrawing) {
      draw(x, y)
    }
  }
  
  const handleMouseEnter = () => {
    setShowCursor(true)
  }
  
  const handleMouseLeave = () => {
    setShowCursor(false)
    stopDrawing()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveToHistory()
    }
  }

  const saveToHistory = () => {
    if (!maskCanvasRef.current) return
    
    const maskData = maskCanvasRef.current.toDataURL()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(maskData)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      restoreFromHistory(history[newIndex])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      restoreFromHistory(history[newIndex])
    }
  }

  const restoreFromHistory = (dataUrl) => {
    const img = new Image()
    img.onload = () => {
      const ctx = maskCanvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = dataUrl
  }

  const clearMask = () => {
    const ctx = maskCanvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
    saveToHistory()
  }

  const generateMaskBlob = async () => {
    return new Promise((resolve) => {
      // Create a black and white mask
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = maskCanvasRef.current.width
      tempCanvas.height = maskCanvasRef.current.height
      const tempCtx = tempCanvas.getContext('2d')
      
      // Fill with black
      tempCtx.fillStyle = 'black'
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      
      // Draw white where mask exists
      tempCtx.globalCompositeOperation = 'source-over'
      tempCtx.filter = 'none'
      const maskCtx = maskCanvasRef.current.getContext('2d')
      const imageData = maskCtx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
      
      // Convert red mask to white
      for (let i = 0; i < imageData.data.length; i += 4) {
        if (imageData.data[i + 3] > 0) { // If there's any alpha
          imageData.data[i] = 255     // R
          imageData.data[i + 1] = 255 // G
          imageData.data[i + 2] = 255 // B
          imageData.data[i + 3] = 255 // A
        }
      }
      
      tempCtx.putImageData(imageData, 0, 0)
      
      tempCanvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/png')
    })
  }

  const handleInpaint = async () => {
    if (!originalImage || !prompt) {
      setError('Please provide an image and a prompt')
      return
    }

    setIsInpainting(true)
    setError(null)

    try {
      // Generate mask blob
      const maskBlob = await generateMaskBlob()
      
      // Upload original image if it's not already a URL
      let uploadedImageUrl = imageUrl
      if (imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        const file = new File([blob], 'image.png', { type: 'image/png' })
        
        const fileExt = 'png'
        const fileName = `inpaint-original-${user.id}-${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('user-uploads')
          .upload(fileName, file)
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('user-uploads')
          .getPublicUrl(fileName)
        
        uploadedImageUrl = publicUrl
      }

      // Upload mask
      const maskFileName = `inpaint-mask-${user.id}-${Date.now()}.png`
      const { data: maskUploadData, error: maskUploadError } = await supabaseAdmin.storage
        .from('user-uploads')
        .upload(maskFileName, maskBlob)
      
      if (maskUploadError) throw maskUploadError
      
      const { data: { publicUrl: maskUrl } } = supabaseAdmin.storage
        .from('user-uploads')
        .getPublicUrl(maskFileName)

      // Perform inpainting
      const result = await performInpainting(uploadedImageUrl, maskUrl, prompt, {
        negative_prompt: negativePrompt
      })

      // Handle result
      if (result instanceof Blob) {
        const url = URL.createObjectURL(result)
        setInpaintedImage(url)
        
        // Upload result to storage
        const resultFileName = `inpaint-result-${user.id}-${Date.now()}.png`
        const { data: resultUpload, error: resultError } = await supabaseAdmin.storage
          .from('generated-flyers')
          .upload(resultFileName, result)
        
        if (!resultError) {
          const { data: { publicUrl: resultUrl } } = supabaseAdmin.storage
            .from('generated-flyers')
            .getPublicUrl(resultFileName)
          
          // Save to database
          await supabase.from('generations').insert({
            user_id: user.id,
            custom_prompt: `Inpainting: ${prompt}`,
            image_url: uploadedImageUrl,
            result_url: resultUrl,
            metadata: {
              type: 'inpainting',
              prompt,
              negative_prompt: negativePrompt,
              mask_url: maskUrl
            }
          })
        }
      }
    } catch (err) {
      console.error('Inpainting error:', err)
      setError(`Failed to inpaint: ${err.message}`)
    } finally {
      setIsInpainting(false)
    }
  }

  const downloadResult = () => {
    if (!inpaintedImage) return
    
    const a = document.createElement('a')
    a.href = inpaintedImage
    a.download = `inpainted-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const saveAndNavigate = () => {
    if (inpaintedImage) {
      navigate('/generated', {
        state: {
          imageUrl: inpaintedImage,
          prompt: `Inpainting: ${prompt}`
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Image Inpainting</h1>
        
        {!imageLoaded && (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                Upload an image to edit
              </label>
              <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
            </div>
          </div>
        )}

        {imageLoaded && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Edit Area</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    className="p-2 rounded hover:bg-gray-100"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                    className="p-2 rounded hover:bg-gray-100"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative overflow-auto max-h-[600px] border rounded-lg bg-gray-50">
                <div 
                  style={{ 
                    transform: `scale(${zoom})`, 
                    transformOrigin: 'top left',
                    width: originalImage ? originalImage.width : '100%',
                    height: originalImage ? originalImage.height : '400px',
                    position: 'relative'
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0"
                    style={{ display: imageLoaded ? 'block' : 'none' }}
                  />
                  <canvas
                    ref={maskCanvasRef}
                    className="absolute top-0 left-0 cursor-none"
                    style={{ display: imageLoaded ? 'block' : 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={handleMouseMove}
                    onMouseUp={stopDrawing}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
                  {/* Custom cursor */}
                  {showCursor && imageLoaded && (
                    <div
                      className="pointer-events-none absolute border-2 rounded-full"
                      style={{
                        left: cursorPosition.x - (brushSize * zoom) / 2,
                        top: cursorPosition.y - (brushSize * zoom) / 2,
                        width: brushSize * zoom,
                        height: brushSize * zoom,
                        borderColor: brushMode === 'draw' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                        backgroundColor: brushMode === 'draw' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'
                      }}
                    />
                  )}
                  {!imageLoaded && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Loading image...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                  <strong>Instructions:</strong> Draw a red mask over the areas you want to edit. 
                  Use "Draw" to add to the mask and "Erase" to remove parts of the mask.
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setBrushMode('draw')}
                    className={`flex items-center px-3 py-2 rounded ${
                      brushMode === 'draw' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Brush className="w-4 h-4 mr-2" />
                    Draw Mask
                  </button>
                  <button
                    onClick={() => setBrushMode('erase')}
                    className={`flex items-center px-3 py-2 rounded ${
                      brushMode === 'erase' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Eraser className="w-4 h-4 mr-2" />
                    Erase Mask
                  </button>
                  <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="p-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Undo"
                  >
                    <Undo className="w-4 h-4" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Redo"
                  >
                    <Redo className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearMask}
                    className="px-3 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium">Brush Size:</label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">{brushSize}px</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Inpainting Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What should appear in the masked area?
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A blue sky with clouds, A wooden floor, Remove the object"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Negative Prompt (optional)
                  </label>
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="e.g., blurry, low quality, distorted"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleInpaint}
                  disabled={isInpainting || !prompt}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center ${
                    isInpainting || !prompt
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isInpainting ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brush className="w-5 h-5 mr-2" />
                      Apply Inpainting
                    </>
                  )}
                </button>

                {inpaintedImage && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Result</h3>
                    <img
                      src={inpaintedImage}
                      alt="Inpainted result"
                      className="w-full rounded-lg shadow-md"
                    />
                    <div className="mt-3 flex space-x-3">
                      <button
                        onClick={downloadResult}
                        className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                      <button
                        onClick={saveAndNavigate}
                        className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save & View
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Inpainting