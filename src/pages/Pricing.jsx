import { Check } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'

const Pricing = () => {
  const { user } = useUser()

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      features: [
        '10 flyer generations per month',
        'Access to basic templates',
        'Standard quality output',
        'Community support'
      ],
      buttonText: 'Current Plan',
      buttonStyle: 'bg-gray-300 text-gray-600 cursor-default'
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      features: [
        '100 flyer generations per month',
        'Access to all premium templates',
        'High quality output',
        'Custom branding options',
        'Priority support',
        'Download in multiple formats'
      ],
      buttonText: 'Upgrade to Pro',
      buttonStyle: 'bg-indigo-600 text-white hover:bg-indigo-700',
      recommended: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      features: [
        'Unlimited flyer generations',
        'Custom template creation',
        'Ultra high quality output',
        'White-label options',
        'API access',
        'Dedicated account manager',
        'Custom integrations'
      ],
      buttonText: 'Contact Sales',
      buttonStyle: 'bg-gray-900 text-white hover:bg-gray-800'
    }
  ]

  const handleSubscribe = async (planName) => {
    if (planName === 'Pro') {
      window.open('https://billing.stripe.com/checkout/your-pro-plan-link', '_blank')
    } else if (planName === 'Enterprise') {
      window.location.href = 'mailto:sales@flyergenerator.com?subject=Enterprise Plan Inquiry'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-gray-600">
          Select the perfect plan for your flyer generation needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-lg shadow-lg overflow-hidden ${
              plan.recommended ? 'ring-2 ring-indigo-600' : ''
            }`}
          >
            {plan.recommended && (
              <div className="bg-indigo-600 text-white text-center py-1 text-sm font-medium">
                Recommended
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-600">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.name)}
                className={`w-full py-3 rounded-lg font-medium transition ${plan.buttonStyle}`}
              >
                {plan.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4 max-w-3xl mx-auto">
          <div>
            <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
            <p className="text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What happens if I exceed my generation limit?</h3>
            <p className="text-gray-600">
              You'll need to wait for your monthly limit to reset or upgrade to a higher plan for more generations.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Do unused generations roll over?</h3>
            <p className="text-gray-600">
              No, unused generations do not roll over to the next month. Your limit resets at the beginning of each billing cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pricing