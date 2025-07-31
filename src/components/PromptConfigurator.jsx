import { useState } from 'react'
import { Plus, X } from 'lucide-react'

const PromptConfigurator = ({ basePrompt, customPrompt, setCustomPrompt, quality, setQuality }) => {
  const [parameters, setParameters] = useState({
    mainText: '',
    secondaryText: '',
    colors: '',
    style: '',
    additionalElements: [],
    elementDetails: {} // Store details for each element
  })

  const updateParameter = (key, value) => {
    const newParams = { ...parameters, [key]: value }
    setParameters(newParams)
    generatePrompt(newParams)
  }

  const updateElementDetail = (element, detail) => {
    const newParams = {
      ...parameters,
      elementDetails: {
        ...parameters.elementDetails,
        [element]: detail
      }
    }
    setParameters(newParams)
    generatePrompt(newParams)
  }

  const generatePrompt = (params) => {
    const promptAdditions = []
    if (params.mainText) promptAdditions.push(`Main text: "${params.mainText}"`)
    if (params.secondaryText) promptAdditions.push(`Secondary text: "${params.secondaryText}"`)
    if (params.colors) promptAdditions.push(`Color scheme: ${params.colors}`)
    if (params.style) promptAdditions.push(`Style: ${params.style}`)
    
    // Add elements with their details
    if (params.additionalElements.length > 0) {
      const elementsWithDetails = params.additionalElements.map(element => {
        const detail = params.elementDetails[element]
        if (detail) {
          return `${element}: ${detail}`
        }
        return element
      })
      promptAdditions.push(`Additional elements: ${elementsWithDetails.join(', ')}`)
    }
    
    setCustomPrompt(promptAdditions.join('. '))
  }

  const addElement = (element) => {
    if (element && !parameters.additionalElements.includes(element)) {
      updateParameter('additionalElements', [...parameters.additionalElements, element])
    }
  }

  const removeElement = (element) => {
    // Remove element and its details
    const newDetails = { ...parameters.elementDetails }
    delete newDetails[element]
    
    const newParams = {
      ...parameters,
      additionalElements: parameters.additionalElements.filter((el) => el !== element),
      elementDetails: newDetails
    }
    setParameters(newParams)
    generatePrompt(newParams)
  }

  const suggestedElements = [
    'Logo', 'Contact info', 'Social media handles', 'QR code',
    'Date and time', 'Location', 'Call to action', 'Price tag'
  ]

  const getPlaceholder = (element) => {
    const placeholders = {
      'Logo': 'e.g., Company logo in top right corner',
      'Contact info': 'e.g., Call: 123-456-7890, Email: info@example.com',
      'Social media handles': 'e.g., @yourbusiness on Instagram and Facebook',
      'QR code': 'e.g., QR code linking to website or menu',
      'Date and time': 'e.g., July 15th, 2024 at 6:00 PM',
      'Location': 'e.g., 123 Main Street, City, State 12345',
      'Call to action': 'e.g., Book Now! or Limited Time Offer',
      'Price tag': 'e.g., Starting at $99 or 50% OFF'
    }
    return placeholders[element] || `Enter ${element.toLowerCase()} details`
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Main Text (Title/Name)
        </label>
        <input
          type="text"
          value={parameters.mainText}
          onChange={(e) => updateParameter('mainText', e.target.value)}
          placeholder="e.g., John Doe, Summer Sale, Grand Opening"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Secondary Text (Subtitle/Details)
        </label>
        <input
          type="text"
          value={parameters.secondaryText}
          onChange={(e) => updateParameter('secondaryText', e.target.value)}
          placeholder="e.g., CEO & Founder, 50% Off Everything, Join us on July 15th"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Color Preferences
        </label>
        <input
          type="text"
          value={parameters.colors}
          onChange={(e) => updateParameter('colors', e.target.value)}
          placeholder="e.g., Blue and gold, Vibrant pastels, Corporate colors"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Style Preferences
        </label>
        <select
          value={parameters.style}
          onChange={(e) => updateParameter('style', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a style</option>
          <option value="Modern and minimalist">Modern & Minimalist</option>
          <option value="Bold and vibrant">Bold & Vibrant</option>
          <option value="Elegant and sophisticated">Elegant & Sophisticated</option>
          <option value="Fun and playful">Fun & Playful</option>
          <option value="Corporate and professional">Corporate & Professional</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quality
        </label>
        <select
          value={quality || 'auto'}
          onChange={(e) => setQuality(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="auto">Auto (Default)</option>
          <option value="low">Low Quality (Faster)</option>
          <option value="medium">Medium Quality</option>
          <option value="high">High Quality (Slower)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Elements
        </label>
        
        {/* Custom input for additional elements */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Type custom element and press Enter"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                addElement(e.target.value.trim())
                e.target.value = ''
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        {/* Selected elements with detail inputs */}
        {parameters.additionalElements.length > 0 && (
          <div className="space-y-3 mb-4">
            {parameters.additionalElements.map((element) => (
              <div key={element} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-700">{element}</span>
                  <button
                    onClick={() => removeElement(element)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={parameters.elementDetails[element] || ''}
                  onChange={(e) => updateElementDetail(element, e.target.value)}
                  placeholder={getPlaceholder(element)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Suggested elements */}
        <p className="text-xs text-gray-600 mb-2">Quick add suggestions:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedElements
            .filter((el) => !parameters.additionalElements.includes(el))
            .map((element) => (
              <button
                key={element}
                onClick={() => addElement(element)}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm border border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" />
                {element}
              </button>
            ))}
        </div>
      </div>

      {customPrompt && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Custom additions:</span> {customPrompt}
          </p>
        </div>
      )}
    </div>
  )
}

export default PromptConfigurator