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
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex space-x-1.5 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <div className="space-y-3">
            {/* Account Card */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">@yourbusiness</div>
                  <div className="text-xs text-gray-500">Business Account</div>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="text-xs text-gray-500">Followers</div>
                <div className="text-sm font-bold text-gray-800">24.5K</div>
              </div>
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="text-xs text-gray-500">Messages</div>
                <div className="text-sm font-bold text-gray-800">1.2K</div>
              </div>
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="text-xs text-gray-500">Response</div>
                <div className="text-sm font-bold text-gray-800">98%</div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-700">Webhook Active</span>
              </div>
              <span className="text-xs text-green-600">Live</span>
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
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex space-x-1.5 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <div className="space-y-3">
            {/* Mini Flow Builder Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="text-xs font-semibold text-gray-700">Flow Builder</div>
                <div className="bg-purple-100 text-purple-600 text-[10px] px-2 py-0.5 rounded-full">Comment Automation</div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-[10px] text-green-600">Active</span>
              </div>
            </div>

            {/* Horizontal Flow */}
            <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                {/* Start */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shadow-sm">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[9px] text-gray-600">Start</span>
                </div>

                {/* Arrow */}
                <div className="flex-1 mx-1">
                  <div className="h-0.5 bg-purple-400 relative">
                    <div className="absolute right-0 -top-[3px]">
                      <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-purple-400"></div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center shadow-sm">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[9px] text-gray-600">Message</span>
                </div>

                {/* Arrow */}
                <div className="flex-1 mx-1">
                  <div className="h-0.5 bg-blue-400 relative">
                    <div className="absolute right-0 -top-[3px]">
                      <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-blue-400"></div>
                    </div>
                  </div>
                </div>

                {/* Wait */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-8 h-8 rounded bg-orange-500 flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-[9px] text-gray-600">Wait</span>
                </div>

                {/* Arrow */}
                <div className="flex-1 mx-1">
                  <div className="h-0.5 bg-orange-400 relative">
                    <div className="absolute right-0 -top-[3px]">
                      <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-orange-400"></div>
                    </div>
                  </div>
                </div>

                {/* Tag */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span className="text-[9px] text-gray-600">Tag</span>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className="text-xs font-bold text-gray-800">4</div>
                  <div className="text-[9px] text-gray-500">Nodes</div>
                </div>
                <div className="w-px h-6 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-xs font-bold text-gray-800">1.2k</div>
                  <div className="text-[9px] text-gray-500">Sent/day</div>
                </div>
                <div className="w-px h-6 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-xs font-bold text-gray-800">95%</div>
                  <div className="text-[9px] text-gray-500">Success</div>
                </div>
              </div>
              <button className="text-[10px] text-purple-600 hover:text-purple-700 font-medium">Edit →</button>
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
              className={`relative mb-16 lg:mb-24 ${
                index % 2 === 0 ? 'lg:pr-1/2' : 'lg:pl-1/2 lg:ml-auto'
              }`}
            >
              <div className={`lg:flex items-center ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              }`}>
                {/* Step Number - Mobile/Desktop Responsive */}
                <div className={`flex items-center mb-4 lg:mb-0 ${
                  index % 2 === 0 ? 'lg:mr-8' : 'lg:ml-8'
                }`}>
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
                <div className={`flex-1 grid lg:grid-cols-2 gap-8 ${
                  index % 2 === 0 ? '' : 'lg:flex-row-reverse'
                }`}>
                  {/* Text Content */}
                  <div className={`${index % 2 === 0 ? 'lg:pr-8' : 'lg:pl-8 lg:order-2'}`}>
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
                  <div className={`${index % 2 === 0 ? '' : 'lg:order-1'}`}>
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