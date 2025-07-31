import { Link } from 'react-router-dom'
import { Sparkles, Zap, Shield } from 'lucide-react'

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Create Stunning Flyers in Seconds
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered flyer generation with customizable prompts and professional templates
          </p>
          <div className="space-x-4">
            <Link
              to="/sign-up"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Get Started Free
            </Link>
            <Link
              to="/sign-in"
              className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium border border-indigo-200 hover:bg-indigo-50 transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Sparkles className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI-Powered Design</h3>
            <p className="text-gray-600">
              Advanced AI creates professional flyers from your photos and custom prompts
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Zap className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Generate high-quality flyers in seconds, not hours
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Shield className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Professional Templates</h3>
            <p className="text-gray-600">
              Curated base prompts for various industries and occasions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing