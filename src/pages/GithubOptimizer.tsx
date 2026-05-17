import React, { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { Github, Loader2, Code, FileCode, CheckCircle } from "lucide-react";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default function GithubOptimizer() {
  const [githubUrl, setGithubUrl] = useState("");
  const [role, setRole] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const optimizeGithub = async () => {
    if (!githubUrl.trim() || !role.trim()) {
      alert("Please provide your GitHub URL and target role.");
      return;
    }

    setGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this GitHub profile URL (${githubUrl}) for a ${role} role. Since you can't browse the URL directly, provide general best practices and specific project ideas for a ${role} that they should pin to their profile.
        
        Provide 3 project ideas, 3 README improvement tips, and 3 portfolio structure tips.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
              readmeTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              structureTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["projectIdeas", "readmeTips", "structureTips"],
          },
        },
      });

      const optimizationResult = JSON.parse(response.text || "{}");
      setResult(optimizationResult);
    } catch (error) {
      console.error("Error optimizing GitHub:", error);
      alert("Failed to optimize GitHub profile. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 font-display">
        <Github className="w-8 h-8 text-blue-600" />
        GitHub Profile Optimizer
      </h1>

      <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              GitHub Profile URL
            </label>
            <input
              type="url"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target Role
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="e.g., Backend Developer, Data Scientist"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={optimizeGithub}
          disabled={generating || !githubUrl.trim() || !role.trim()}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm hover:shadow-md"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing Profile...
            </>
          ) : (
            "Optimize GitHub Profile"
          )}
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
              <Code className="w-6 h-6 text-blue-600" />
              Project Ideas
            </h3>
            <ul className="space-y-4">
              {result.projectIdeas.map((idea: string, i: number) => (
                <li
                  key={i}
                  className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-sm text-blue-900 shadow-sm"
                >
                  {idea}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
              <FileCode className="w-6 h-6 text-green-500" />
              README Tips
            </h3>
            <ul className="space-y-4">
              {result.readmeTips.map((tip: string, i: number) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-slate-700"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
              <Github className="w-6 h-6 text-orange-500" />
              Structure Tips
            </h3>
            <ul className="space-y-4">
              {result.structureTips.map((tip: string, i: number) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-slate-700"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
