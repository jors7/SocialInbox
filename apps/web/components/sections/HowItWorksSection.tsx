'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  Sparkles,
  ArrowLeftRight,
  MessageCircle,
  Zap,
  Settings2,
  Rocket
} from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: "Connect Your Instagram Account",
      content: "Link your Instagram Business or Creator account in seconds. Our secure OAuth integration ensures your data is protected while giving you full automation capabilities.",
      additional: "We handle all the complex webhook setup, token management, and API permissions — you just click connect and you're ready to go.",
      color: "green",
      mockup: (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex space-x-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
              <div className="text-sm font-medium mb-1">Instagram Business</div>
              <div className="text-xs opacity-90">@yourbusiness</div>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="text-sm font-medium">Connected Successfully</span>
            </div>
            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
              <div>✓ Webhook verified</div>
              <div>✓ Permissions granted</div>
              <div>✓ Ready to automate</div>
            </div>
          </div>
        </div>
      )
    },
    {
      number: 2,
      title: "Build Visual Automation Flows",
      content: "Design your DM automation with our drag-and-drop flow builder. Create welcome messages, FAQ responses, product recommendations, and complex conversation paths — all without coding.",
      additional: "Use pre-built templates or start from scratch. Add conditions, delays, user inputs, and connect to your favorite tools like Shopify, email platforms, and CRMs.",
      color: "purple",
      mockup: (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex space-x-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="relative">
            <div className="animate-pulse">
              <div className="bg-purple-100 rounded p-3 mb-3">
                <div className="text-xs font-medium text-purple-700">Trigger: Comment with "INFO"</div>
              </div>
              <div className="ml-6 border-l-2 border-purple-300 pl-6 pb-3">
                <div className="bg-purple-50 rounded p-3">
                  <div className="text-xs text-purple-600">Send Welcome Message</div>
                </div>
              </div>
              <div className="ml-6 border-l-2 border-purple-300 pl-6">
                <div className="bg-purple-50 rounded p-3">
                  <div className="text-xs text-purple-600">Collect User Input</div>
                </div>
              </div>
            </div>
            <div className="absolute -right-2 -top-2">
              <div className="animate-spin">
                <Settings2 className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      number: 3,
      title: "Set Intelligent Triggers",
      content: "Turn comments into conversations instantly. Set up triggers for post comments, story mentions, story replies, and specific keywords. Your automation starts working the moment someone engages.",
      additional: "Comment → DM automation, Story Reply → Conversation, @Mention → Instant Response, Keyword Detection across all touchpoints",
      extra: "Stay compliant with Instagram's 24-hour messaging window and seamlessly handoff to human agents when needed.",
      color: "pink",
      mockup: (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex space-x-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-pink-50 p-3 rounded-lg">
              <div className="text-xs font-medium text-pink-700">Active Triggers</div>
              <div className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">12 Active</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-pink-500" />
                <span className="text-xs">Comment "DISCOUNT" → Send promo code</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-pink-500" />
                <span className="text-xs">Story reply → Product catalog</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-pink-500" />
                <span className="text-xs">@mention → Welcome flow</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Response Rate</span>
              <span className="text-pink-600 font-bold">98.5%</span>
            </div>
          </div>
        </div>
      )
    },
    {
      number: 4,
      title: "Scale & Analyze Performance",
      content: "Watch your engagement soar with real-time analytics. Track conversion rates, response times, and customer satisfaction. A/B test different flows and optimize based on data.",
      additional: "Detailed funnel visualization, conversation analytics, revenue attribution, and team performance metrics.",
      extra: "Handle thousands of conversations simultaneously while maintaining that personal touch your followers love.",
      color: "blue",
      mockup: (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex space-x-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-700">This Week</span>
                <ArrowLeftRight className="w-4 h-4 text-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">Messages Sent</div>
                  <div className="text-lg font-bold text-blue-600">12.5K</div>
                </div>
                <div>
                  <div className="text-gray-500">Conversion</div>
                  <div className="text-lg font-bold text-blue-600">24%</div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
              <span className="text-xs font-medium text-blue-600">75%</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How to Automate Instagram DMs in 4 Simple Steps
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From setup to scale, transform your Instagram engagement with powerful automation that feels personal
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          {/* Vertical Line */}
          <div className="hidden lg:block absolute left-8 w-1 h-full bg-gradient-to-b from-green-200 via-purple-400 to-blue-600"></div>

          {/* Steps */}
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={stepVariants}
              custom={index}
              className="relative mb-16 lg:mb-24 lg:ml-16"
            >
              <div className="lg:flex items-center">
                {/* Step Number - Mobile/Desktop Responsive */}
                <div className="flex items-center mb-4 lg:mb-0 lg:absolute lg:-left-16">
                  <div className={`
                    relative w-12 h-12 lg:w-16 lg:h-16 rounded-full
                    flex items-center justify-center font-bold text-white text-lg lg:text-2xl
                    ${step.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' : ''}
                    ${step.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : ''}
                    ${step.color === 'pink' ? 'bg-gradient-to-br from-pink-500 to-pink-600' : ''}
                    ${step.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : ''}
                  `}>
                    {step.number}
                    <div className="absolute inset-0 rounded-full animate-pulse opacity-30 bg-current"></div>
                  </div>
                  <h3 className="ml-4 text-xl lg:text-2xl font-bold text-gray-900 lg:hidden">
                    {step.title}
                  </h3>
                </div>

                {/* Content */}
                <div className="flex-1 grid lg:grid-cols-2 gap-8">
                  {/* Text Content */}
                  <div className="lg:pr-8">
                    <h3 className="hidden lg:block text-2xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {step.content}
                    </p>
                    {step.additional && (
                      <p className={`
                        text-sm mb-3
                        ${step.color === 'green' ? 'text-green-700 bg-green-50' : ''}
                        ${step.color === 'purple' ? 'text-purple-700 bg-purple-50' : ''}
                        ${step.color === 'pink' ? 'text-pink-700 bg-pink-50' : ''}
                        ${step.color === 'blue' ? 'text-blue-700 bg-blue-50' : ''}
                        p-3 rounded-lg
                      `}>
                        {step.additional}
                      </p>
                    )}
                    {step.extra && (
                      <p className="text-sm text-gray-500 italic">
                        {step.extra}
                      </p>
                    )}
                  </div>

                  {/* Mockup */}
                  <div>
                    <div className={`
                      relative p-1 rounded-xl
                      ${step.color === 'green' ? 'bg-gradient-to-br from-green-200 to-green-300' : ''}
                      ${step.color === 'purple' ? 'bg-gradient-to-br from-purple-200 to-purple-300' : ''}
                      ${step.color === 'pink' ? 'bg-gradient-to-br from-pink-200 to-pink-300' : ''}
                      ${step.color === 'blue' ? 'bg-gradient-to-br from-blue-200 to-blue-300' : ''}
                    `}>
                      {step.mockup}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-16"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to 10x Your Instagram Engagement?
          </h3>
          <p className="text-gray-600 mb-8">
            Join thousands of businesses automating their Instagram DMs with SocialInbox
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-full hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200">
            Start Free Trial →
          </button>
        </motion.div>
      </div>
    </section>
  );
}