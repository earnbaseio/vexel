"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const AnimatedStats = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.3 });

  const stats = [
    {
      id: 1,
      number: 10000,
      suffix: "+",
      label: "AI Agents Deployed",
      description: "Active agents serving users worldwide",
      icon: "🤖",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: 2,
      number: 99.9,
      suffix: "%",
      label: "Uptime Reliability",
      description: "Enterprise-grade infrastructure",
      icon: "⚡",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 3,
      number: 50,
      suffix: "ms",
      label: "Average Response Time",
      description: "Lightning-fast AI processing",
      icon: "🚀",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: 4,
      number: 1000000,
      suffix: "+",
      label: "Tasks Completed",
      description: "Successful autonomous executions",
      icon: "✅",
      color: "from-orange-500 to-red-500",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section ref={ref} className="py-24 bg-slate-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Trusted by Thousands
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Join the growing community of developers and enterprises leveraging Vexel AI for their most critical workflows
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {stats.map((stat, index) => (
            <StatCard key={stat.id} stat={stat} index={index} isInView={isInView} />
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-white/60 mb-8">Trusted by leading organizations</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {/* Placeholder for company logos */}
            {["TechCorp", "InnovateLab", "FutureAI", "DataFlow", "CloudTech", "SmartSys"].map((company, index) => (
              <motion.div
                key={company}
                className="px-6 py-3 bg-white/5 rounded-lg border border-white/10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
              >
                <span className="text-white/70 font-medium">{company}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const StatCard = ({ stat, index, isInView }: { stat: any; index: number; isInView: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const timer = setTimeout(() => {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = stat.number / steps;
      let current = 0;

      const counter = setInterval(() => {
        current += increment;
        if (current >= stat.number) {
          setCount(stat.number);
          clearInterval(counter);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(counter);
    }, index * 200); // Stagger the animations

    return () => clearTimeout(timer);
  }, [isInView, stat.number, index]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + "K";
    }
    return num.toString();
  };

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="relative p-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300">
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
        
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
          {stat.icon}
        </div>

        {/* Number */}
        <div className="mb-4">
          <motion.span
            className="text-4xl md:text-5xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
          >
            {stat.suffix === "ms" ? count.toFixed(0) : formatNumber(count)}
          </motion.span>
          <span className="text-4xl md:text-5xl font-bold text-white/70">
            {stat.suffix}
          </span>
        </div>

        {/* Label */}
        <h3 className="text-xl font-semibold text-white mb-2">
          {stat.label}
        </h3>

        {/* Description */}
        <p className="text-white/60 text-sm">
          {stat.description}
        </p>

        {/* Progress Bar */}
        <div className="mt-6 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
            initial={{ width: 0 }}
            animate={isInView ? { width: "100%" } : { width: 0 }}
            transition={{ duration: 1.5, delay: index * 0.2 + 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedStats;
