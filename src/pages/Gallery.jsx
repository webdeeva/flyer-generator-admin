import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import { Download, Share2, Trash2, Eye } from 'lucide-react'

const Gallery = () => {
  const { user } = useUser()
  const [generations, setGenerations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    if (user) {
      fetchGenerations()
    }
  }, [user])

  const fetchGenerations = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('generations')
      .select('*, base_prompts(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      // Only show generations with result_url (completed flyers)
      const completedGenerations = data.filter(gen => gen.result_url)
      setGenerations(completedGenerations)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this generation?')) {
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', id)

      if (!error) {
        setGenerations(generations.filter(g => g.id !== id))
      }
    }
  }

  const handleDownload = async (imageUrl, id) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flyer-${id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleShare = async (imageUrl) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my flyer!',
          text: 'Generated with Flyer Generator',
          url: imageUrl
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      navigator.clipboard.writeText(imageUrl)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your gallery...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">Your Gallery</h1>
        <p className="text-gray-600">
          {generations.length} {generations.length === 1 ? 'generation' : 'generations'}
        </p>
      </div>

      {generations.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generations.map((generation) => (
            <div key={generation.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative group">
                <img
                  src={generation.result_url}
                  alt="Generated flyer"
                  className="w-full h-64 object-cover cursor-pointer"
                  onClick={() => setSelectedImage(generation)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setSelectedImage(generation)}
                    className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900">
                  {generation.base_prompts?.title || 'Custom Prompt'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(generation.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleDownload(generation.result_url, generation.id)}
                    className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => handleShare(generation.result_url)}
                    className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 flex items-center justify-center"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </button>
                  <button
                    onClick={() => handleDelete(generation.id)}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500">No generations yet. Create your first flyer!</p>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={selectedImage.result_url}
              alt="Generated flyer"
              className="max-w-full max-h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Gallery