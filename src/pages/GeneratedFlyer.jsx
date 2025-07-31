import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Download, RefreshCw, ArrowLeft, Share2, Edit } from 'lucide-react'

const GeneratedFlyer = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Get the flyer data from navigation state
  const { imageUrl, prompt, promptId } = location.state || {}

  useEffect(() => {
    // If no image data, redirect back to generator
    if (!imageUrl) {
      navigate('/generate')
    }
  }, [imageUrl, navigate])

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Fetch the image
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flyer-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRegenerate = () => {
    // Navigate back to generator with the same prompt data
    navigate('/generate', { 
      state: { 
        previousPrompt: prompt,
        previousPromptId: promptId 
      } 
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my generated flyer!',
          text: 'Created with AI Flyer Generator',
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handleEdit = () => {
    // Navigate to inpainting page with the current image
    navigate('/inpainting', { 
      state: { 
        imageUrl: imageUrl
      } 
    })
  }

  if (!imageUrl) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/generate')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Generator
            </button>
            <h1 className="text-xl font-semibold">Your Generated Flyer</h1>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Image Display */}
          <div className="relative bg-gray-100 p-8">
            <img
              src={imageUrl}
              alt="Generated flyer"
              className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-xl"
            />
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gray-50">
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download Flyer'}
              </button>
              
              <button
                onClick={handleRegenerate}
                className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Generate New Version
              </button>
              
              <button
                onClick={handleEdit}
                className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Edit className="w-5 h-5 mr-2" />
                Edit Image
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </button>
            </div>
          </div>

          {/* Prompt Info */}
          {prompt && (
            <div className="p-6 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Prompt Used:</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{prompt}</p>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Pro Tips:</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Download your flyer in high resolution for best print quality</li>
            <li>• Generate multiple versions to find the perfect design</li>
            <li>• Share directly to social media or save for later use</li>
            <li>• Your generated flyers are saved in your history</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default GeneratedFlyer