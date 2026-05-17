import React, { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import {
  TrendingUp,
  Loader2,
  Target,
  BookOpen,
  Award,
  Calendar,
} from "lucide-react";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default function SkillGap() {
  const [role, setRole] = useState("");
  const [currentSkills, setCurrentSkills] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyzeSkills = async () => {
    if (!role.trim() || !currentSkills.trim()) {
      alert("Please provide your target role and current skills.");
      return;
    }

    setAnalyzing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the skill gap for a ${role} role.
        Current Skills: ${currentSkills}
        
        Provide the top trending skills for this role, salary trends, courses to learn, certifications to add, and a 30-day improvement roadmap.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              trendingSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              salaryTrends: { type: Type.STRING },
              courses: { type: Type.ARRAY, items: { type: Type.STRING } },
              certifications: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              roadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              "trendingSkills",
              "salaryTrends",
              "courses",
              "certifications",
              "roadmap",
            ],
          },
        },
      });

      const analysisResult = JSON.parse(response.text || "{}");
      setResult(analysisResult);
    } catch (error) {
      console.error("Error analyzing skills:", error);
      alert("Failed to analyze skills. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 font-display">
        <TrendingUp className="w-8 h-8 text-blue-600" />
        Skill Gap Analyzer
      </h1>

      <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target Role
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="e.g., Full Stack Developer, UX Designer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Skills (comma separated)
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="e.g., HTML, CSS, JavaScript, React"
              value={currentSkills}
              onChange={(e) => setCurrentSkills(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={analyzeSkills}
          disabled={analyzing || !role.trim() || !currentSkills.trim()}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm hover:shadow-md"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing Skill Gap...
            </>
          ) : (
            "Analyze Skill Gap"
          )}
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6 font-display">
                <Target className="w-6 h-6 text-blue-600" />
                Trending Skills for {role}
              </h3>
              <div className="flex flex-wrap gap-3">
                {result.trendingSkills.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border border-blue-100 shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6 font-display">
                <Calendar className="w-6 h-6 text-green-600" />
                30-Day Improvement Roadmap
              </h3>
              <div className="space-y-6">
                {result.roadmap.map((step: string, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shadow-sm">
                        {i + 1}
                      </div>
                      {i < result.roadmap.length - 1 && (
                        <div className="w-0.5 h-full bg-green-100 mt-2"></div>
                      )}
                    </div>
                    <div className="pb-6 pt-2">
                      <p className="text-slate-700 text-sm leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6 font-display">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                Salary Trends
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed">{result.salaryTrends}</p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6 font-display">
                <BookOpen className="w-6 h-6 text-blue-500" />
                Recommended Courses
              </h3>
              <ul className="space-y-4">
                {result.courses.map((course: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-slate-700"
                  >
                    <span className="text-blue-500 mt-0.5 font-bold">→</span>
                    {course}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6 font-display">
                <Award className="w-6 h-6 text-orange-500" />
                Certifications to Add
              </h3>
              <ul className="space-y-4">
                {result.certifications.map((cert: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-slate-700"
                  >
                    <span className="text-orange-500 mt-0.5 font-bold">★</span>
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
