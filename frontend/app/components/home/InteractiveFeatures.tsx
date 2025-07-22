"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const InteractiveFeatures = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: 0,
      title: "Advanced Memory System",
      description: "AI agents with persistent memory that learn and adapt from every interaction, building comprehensive knowledge over time.",
      icon: "🧠",
      color: "from-purple-500 to-pink-500",
      stats: ["99.9% Memory Retention", "Real-time Learning", "Context Awareness"],
      demo: {
        title: "Memory in Action",
        content: "Agent remembers: 'User prefers technical documentation with code examples and detailed explanations.'"
      }
    },
    {
      id: 1,
      title: "Team Collaboration",
      description: "Multi-agent coordination with intelligent task distribution, real-time communication, and collaborative problem-solving.",
      icon: "🤝",
      color: "from-blue-500 to-cyan-500",
      stats: ["Multi-Agent Sync", "Task Distribution", "Real-time Chat"],
      demo: {
        title: "Collaboration Flow",
        content: "Agent A: 'Analyzing data...' → Agent B: 'Processing results...' → Agent C: 'Generating report...'"
      }
    },
    {
      id: 2,
      title: "Autonomous Workflows",
      description: "Self-executing workflows that adapt to changing conditions, make decisions, and optimize processes automatically.",
      icon: "⚡",
      color: "from-green-500 to-emerald-500",
      stats: ["Auto-Optimization", "Decision Making", "Process Adaptation"],
      demo: {
        title: "Workflow Execution",
        content: "Trigger: New data → Process: Analysis → Decision: Route to specialist → Action: Execute task"
      }
    },
    {
      id: 3,
      title: "Vector Knowledge Base",
      description: "Intelligent information storage and retrieval using advanced vector embeddings for semantic search and knowledge discovery.",
      icon: "🔍",
      color: "from-orange-500 to-red-500",
      stats: ["Semantic Search", "Knowledge Discovery", "Vector Embeddings"],
      demo: {
        title: "Knowledge Retrieval",
        content: "Query: 'How to optimize performance?' → Results: 15 relevant documents found in 0.03s"
      }
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Powerful AI Capabilities
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Experience the next generation of AI agents with advanced features designed for modern workflows
          </p>
        </motion.div>

        {/* Interactive Feature Grid */}
        <motion.div
          className="grid lg:grid-cols-2 gap-8 items-start"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Feature Cards */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                variants={cardVariants}
                className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  activeFeature === index
                    ? 'bg-white/10 border-white/30 backdrop-blur-md'
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                }`}
                onClick={() => setActiveFeature(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-2xl`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-white/70 mb-4">
                      {feature.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {feature.stats.map((stat, statIndex) => (
                        <span
                          key={statIndex}
                          className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/80"
                        >
                          {stat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Active Indicator */}
                {activeFeature === index && (
                  <motion.div
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${feature.color} rounded-l-2xl`}
                    layoutId="activeIndicator"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Demo Panel */}
          <motion.div
            className="lg:sticky lg:top-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${features[activeFeature].color} flex items-center justify-center text-lg`}>
                    {features[activeFeature].icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {features[activeFeature].demo.title}
                  </h3>
                </div>
                
                {/* Demo Content */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-white/50 text-sm ml-2">vexel-ai-demo</span>
                  </div>
                  <div className="font-mono text-sm text-green-400">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      $ {features[activeFeature].demo.content}
                    </motion.div>
                    <motion.div
                      className="w-2 h-5 bg-green-400 inline-block ml-1"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {features[activeFeature].stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      className="text-center p-3 bg-white/5 rounded-lg border border-white/10"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="text-2xl font-bold text-white mb-1">
                        {index === 0 ? "99%" : index === 1 ? "24/7" : "< 1s"}
                      </div>
                      <div className="text-xs text-white/60">
                        {stat}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default InteractiveFeatures;
