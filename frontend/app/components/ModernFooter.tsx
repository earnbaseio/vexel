"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const ModernFooter = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle subscription logic here
    setIsSubscribed(true);
    setTimeout(() => setIsSubscribed(false), 3000);
  };

  const footerSections = {
    product: {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Documentation", href: "/docs" },
        { name: "API Reference", href: "/api" },
        { name: "Changelog", href: "/changelog" },
      ],
    },
    platform: {
      title: "Platform",
      links: [
        { name: "Agents", href: "/agents" },
        { name: "Workflows", href: "/workflows" },
        { name: "Knowledge Base", href: "/knowledge" },
        { name: "Collaboration", href: "/collaboration" },
        { name: "Integrations", href: "/integrations" },
      ],
    },
    company: {
      title: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Blog", href: "/blog" },
        { name: "Careers", href: "/careers" },
        { name: "Contact", href: "/contact" },
        { name: "Press Kit", href: "/press" },
      ],
    },
    legal: {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "Security", href: "/security" },
        { name: "Compliance", href: "/compliance" },
      ],
    },
  };

  const socialLinks = [
    {
      name: "GitHub",
      href: "https://github.com/vexel-ai",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      name: "Twitter",
      href: "https://twitter.com/vexel_ai",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/vexel-ai",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      name: "Discord",
      href: "https://discord.gg/vexel-ai",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" />
        </svg>
      ),
    },
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Newsletter Section */}
        <motion.div
          className="border-b border-white/10 py-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="max-w-2xl mx-auto text-center"
              variants={itemVariants}
            >
              <h3 className="text-3xl font-bold text-white mb-4">
                Stay Updated with Vexel AI
              </h3>
              <p className="text-xl text-white/70 mb-8">
                Get the latest updates on new features, AI insights, and platform improvements.
              </p>
              
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <motion.input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-colors"
                  whileFocus={{ scale: 1.02 }}
                  required
                />
                <motion.button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubscribed}
                >
                  {isSubscribed ? "✓ Subscribed!" : "Subscribe"}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <motion.div
          className="py-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
              {/* Brand Section */}
              <motion.div
                className="lg:col-span-2"
                variants={itemVariants}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">V</span>
                  </div>
                  <span className="text-2xl font-bold text-white">Vexel</span>
                </div>
                <p className="text-white/70 mb-6 max-w-sm">
                  The next-generation AI agent platform that empowers teams to build, deploy, and scale intelligent automation workflows.
                </p>
                <div className="flex space-x-4">
                  {socialLinks.map((social) => (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {social.icon}
                    </motion.a>
                  ))}
                </div>
              </motion.div>

              {/* Footer Links */}
              {Object.entries(footerSections).map(([key, section]) => (
                <motion.div
                  key={key}
                  variants={itemVariants}
                >
                  <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-white/70 hover:text-white transition-colors duration-300"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          className="border-t border-white/10 py-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
              variants={itemVariants}
            >
              <p className="text-white/60 text-sm">
                © 2025 Vexel AI. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 text-sm text-white/60">
                <span>Built with ❤️ for the AI community</span>
                <div className="flex items-center space-x-1">
                  <span>⚡</span>
                  <span>Powered by Next.js 15.4</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default ModernFooter;
