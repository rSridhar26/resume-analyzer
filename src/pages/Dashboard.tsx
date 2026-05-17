import React, { useEffect, useState } from "react";
import { FileText, Briefcase, TrendingUp, CheckCircle, ArrowRight, Sparkles, Calculator, FileEdit, Linkedin, Github, MessageSquare, Lightbulb, Target, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  },
};

const toolCategories = [
  {
    title: "Resume Optimization",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
    tools: [
      {
        title: "Analyze Resume",
        description: "Score your resume against ATS systems and get actionable feedback.",
        icon: FileText,
        theme: {
          bg: "bg-emerald-50/50",
          iconBg: "bg-emerald-100",
          text: "text-emerald-600",
          border: "border-emerald-100",
          hover: "hover:border-emerald-300 hover:shadow-emerald-100",
        },
        path: "/resume-analyzer",
      },
      {
        title: "Achievement Quantifier",
        description: "Transform generic duties into metric-driven achievements.",
        icon: Calculator,
        theme: {
          bg: "bg-emerald-50/50",
          iconBg: "bg-emerald-100",
          text: "text-emerald-600",
          border: "border-emerald-100",
          hover: "hover:border-emerald-300 hover:shadow-emerald-100",
        },
        path: "/quantifier",
      },
      {
        title: "Cover Letter",
        description: "Generate tailored cover letters for specific job applications.",
        icon: FileEdit,
        theme: {
          bg: "bg-emerald-50/50",
          iconBg: "bg-emerald-100",
          text: "text-emerald-600",
          border: "border-emerald-100",
          hover: "hover:border-emerald-300 hover:shadow-emerald-100",
        },
        path: "/cover-letter",
      },
    ],
  },
  {
    title: "Profile Building",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
    tools: [
      {
        title: "LinkedIn Optimizer",
        description: "Generate a professional summary and headline for your profile.",
        icon: Linkedin,
        theme: {
          bg: "bg-blue-50/50",
          iconBg: "bg-blue-100",
          text: "text-blue-600",
          border: "border-blue-100",
          hover: "hover:border-blue-300 hover:shadow-blue-100",
        },
        path: "/linkedin",
      },
      {
        title: "GitHub Optimizer",
        description: "Enhance your GitHub READMEs and repository descriptions.",
        icon: Github,
        theme: {
          bg: "bg-blue-50/50",
          iconBg: "bg-blue-100",
          text: "text-blue-600",
          border: "border-blue-100",
          hover: "hover:border-blue-300 hover:shadow-blue-100",
        },
        path: "/github",
      },
    ],
  },
  {
    title: "Career Readiness",
    badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
    dotColor: "bg-orange-500",
    tools: [
      {
        title: "Role Readiness",
        description: "Compare your experience with a specific job description.",
        icon: Briefcase,
        theme: {
          bg: "bg-orange-50/50",
          iconBg: "bg-orange-100",
          text: "text-orange-600",
          border: "border-orange-100",
          hover: "hover:border-orange-300 hover:shadow-orange-100",
        },
        path: "/job-matcher",
      },
      {
        title: "Skill Gap",
        description: "Identify missing skills and get learning recommendations.",
        icon: TrendingUp,
        theme: {
          bg: "bg-orange-50/50",
          iconBg: "bg-orange-100",
          text: "text-orange-600",
          border: "border-orange-100",
          hover: "hover:border-orange-300 hover:shadow-orange-100",
        },
        path: "/skills",
      },
      {
        title: "Interview Prep",
        description: "Practice with AI-generated questions tailored to your role.",
        icon: MessageSquare,
        theme: {
          bg: "bg-orange-50/50",
          iconBg: "bg-orange-100",
          text: "text-orange-600",
          border: "border-orange-100",
          hover: "hover:border-orange-300 hover:shadow-orange-100",
        },
        path: "/interview",
      },
    ],
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    atsScore: 0,
    missingKeywords: [] as string[],
    weakestSection: "",
    topImprovement: "",
  });
  const [loading, setLoading] = useState(false);

  const getScoreColor = (score: number) => {
    if (score < 50) return "text-red-500";
    if (score < 75) return "text-orange-500";
    return "text-emerald-500";
  };

  const getScoreBg = (score: number) => {
    if (score < 50) return "bg-red-500";
    if (score < 75) return "bg-orange-500";
    return "bg-emerald-500";
  };

  const getScoreLightBg = (score: number) => {
    if (score < 50) return "bg-red-50";
    if (score < 75) return "bg-orange-50";
    return "bg-emerald-50";
  };

  const getScoreMessage = (score: number) => {
    if (score === 0) return "Analyze your first resume to get your ATS score.";
    if (score < 50) return "Your resume needs significant optimization to pass ATS filters.";
    if (score < 75) return "You're getting there. A few tweaks could significantly improve your chances.";
    return "Great job! Your resume is highly optimized for ATS systems.";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 rounded-[2rem] p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-blue-500 opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-4 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span>Your Career Hub</span>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 font-display">
              Welcome back, Student!
            </h1>
            <p className="text-blue-100 max-w-lg text-lg font-medium">
              Ready to land your dream job? Let's optimize your profile and track your progress.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/resume-analyzer")}
            className="whitespace-nowrap px-6 py-3 bg-white text-blue-900 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-colors flex items-center gap-2 w-fit"
          >
            Scan Resume <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* ATS Score Section */}
      <motion.div variants={containerVariants}>
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-white rounded-[2rem] p-8 shadow-md border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 group transition-all hover:shadow-xl"
        >
          <div className="flex-1 w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl ${stats.atsScore ? getScoreLightBg(stats.atsScore) : 'bg-slate-100'} flex items-center justify-center`}>
                <FileText className={`w-7 h-7 ${stats.atsScore ? getScoreColor(stats.atsScore) : 'text-slate-400'}`} />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 font-display">Latest ATS Score</h2>
                <p className="text-slate-500 font-medium">Resume Analyzer</p>
              </div>
            </div>
            
            <p className="text-slate-500 mb-8 text-lg font-medium">
              {getScoreMessage(stats.atsScore)}
            </p>
            
            {/* Linear Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-4 mb-3 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.atsScore}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className={`h-full rounded-full ${stats.atsScore ? getScoreBg(stats.atsScore) : 'bg-slate-300'}`}
              />
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-400">
              <span>0%</span>
              <span className="text-slate-500">Target: 75%+</span>
              <span>100%</span>
            </div>
          </div>

          {/* Big Score Display */}
          <div className="relative flex items-center justify-center w-48 h-48 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="40" 
                className="stroke-slate-100" 
                strokeWidth="8" 
                fill="none" 
              />
              <motion.circle 
                cx="50" cy="50" r="40" 
                className={stats.atsScore ? getScoreColor(stats.atsScore) : 'stroke-slate-300'}
                strokeWidth="8" 
                fill="none" 
                strokeLinecap="round"
                strokeDasharray={251.2}
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * stats.atsScore) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-5xl font-extrabold ${stats.atsScore ? getScoreColor(stats.atsScore) : 'text-slate-400'}`}>
                {stats.atsScore}%
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* AI Insights Section */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 shadow-xl border border-slate-800 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-500 opacity-10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-extrabold font-display">AI Insights</h2>
            </div>
            
            {stats.atsScore > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <Search className="w-5 h-5 text-blue-400" />
                    <p className="text-blue-300 text-sm font-bold uppercase tracking-wider">Missing Keywords</p>
                  </div>
                  <p className="text-lg font-medium text-slate-200">
                    {stats.missingKeywords.length > 0 ? stats.missingKeywords.join(", ") : "None detected"}
                  </p>
                </div>
                
                <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-5 h-5 text-orange-400" />
                    <p className="text-orange-300 text-sm font-bold uppercase tracking-wider">Weak Section</p>
                  </div>
                  <p className="text-lg font-medium text-slate-200">{stats.weakestSection || "None detected"}</p>
                </div>
                
                <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <Lightbulb className="w-5 h-5 text-green-400" />
                    <p className="text-green-300 text-sm font-bold uppercase tracking-wider">Suggested Improvement</p>
                  </div>
                  <p className="text-lg font-medium text-slate-200">{stats.topImprovement || "Looking good!"}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10 text-center">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-slate-200 mb-2">No Insights Yet</h3>
                <p className="text-slate-400 mb-6">Scan your resume to unlock personalized AI insights and recommendations.</p>
                <button
                  onClick={() => navigate("/resume-analyzer")}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2"
                >
                  Scan Resume Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* AI Career Tools Section */}
      <motion.div variants={itemVariants} className="space-y-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-extrabold text-slate-900 font-display">AI Career Tools</h2>
        </div>
        
        {toolCategories.map((category, catIndex) => (
          <div key={category.title} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`px-4 py-1.5 rounded-full border text-sm font-bold flex items-center gap-2 ${category.badgeColor}`}>
                <div className={`w-2 h-2 rounded-full ${category.dotColor}`}></div>
                {category.title}
              </div>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.tools.map((action, index) => (
                <motion.button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-lg ${action.theme.bg} ${action.theme.border} ${action.theme.hover} group`}
                >
                  <div className="flex items-start justify-between w-full mb-6">
                    <div className={`w-12 h-12 rounded-xl ${action.theme.iconBg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className={`w-6 h-6 ${action.theme.text}`} />
                    </div>
                    <div className={`w-8 h-8 rounded-full bg-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                      <ArrowRight className={`w-4 h-4 ${action.theme.text}`} />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">
                    {action.title}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">
                    {action.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
