import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  handleFirestoreError,
  OperationType,
} from "../utils/firestoreErrorHandler";
import { GoogleGenAI, Type } from "@google/genai";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { extractTextFromFile } from "../utils/fileExtractor";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [improvedResult, setImprovedResult] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (analyzing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + 5; // Reaches 95% in about 19 seconds (if interval is 1000ms)
        });
      }, 1000);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setExtracting(true);

      try {
        const text = await extractTextFromFile(selectedFile);
        setResumeText(text);
        // Automatically trigger analysis if text is extracted successfully
        if (text.trim()) {
          analyzeResume(text);
        }
      } catch (error: any) {
        alert(error.message || "Failed to extract text from file.");
      } finally {
        setExtracting(false);
        // Reset input so the same file can be selected again
        e.target.value = '';
      }
    }
  };

  const analyzeResume = async (textToAnalyze = resumeText) => {
    if (!textToAnalyze.trim()) {
      alert("Please provide resume text.");
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setShowComparison(false);
    setImprovedResult(null);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this resume for ATS compatibility. Provide scores out of 100 for overall ATS score, keyword match, skills, experience strength, formatting, and grammar. Also provide detailed feedback on weak bullet points, missing action verbs, lack of measurable results, repetitive words, and unclear summary. Keep feedback extremely concise (max 1 sentence per point). Additionally, provide 2-3 missing keywords, the single weakest section of the resume (e.g., 'Projects', 'Experience', 'Summary'), and the top suggested improvement. Resume Text: ${textToAnalyze}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              atsScore: { type: Type.NUMBER },
              keywordMatchScore: { type: Type.NUMBER },
              skillsScore: { type: Type.NUMBER },
              experienceStrength: { type: Type.NUMBER },
              formattingScore: { type: Type.NUMBER },
              grammarScore: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              weakPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingActionVerbs: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              weakestSection: { type: Type.STRING },
              topImprovement: { type: Type.STRING },
            },
            required: [
              "atsScore",
              "keywordMatchScore",
              "skillsScore",
              "experienceStrength",
              "formattingScore",
              "grammarScore",
              "feedback",
              "missingKeywords",
              "weakestSection",
              "topImprovement",
            ],
          },
        },
      });

      const analysisResult = JSON.parse(response.text || "{}");
      setResult(analysisResult);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      alert("Failed to analyze resume. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const generateImprovedResume = async () => {
    if (!resumeText.trim() || !result) return;
    
    setIsImproving(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert resume writer and ATS optimizer. I will provide an original resume and its ATS analysis feedback. Rewrite the resume to significantly improve its ATS score (aim for 90+). Fix weak bullet points, add strong action verbs, quantify achievements, and naturally integrate missing keywords. 
        
        Original Resume:
        ${resumeText}
        
        Feedback to address:
        - Weak points: ${result.weakPoints?.join(", ")}
        - Missing keywords: ${result.missingKeywords?.join(", ")}
        - Top improvement needed: ${result.topImprovement}
        
        Return a JSON object with:
        1. improvedText: The full rewritten resume in plain text (keep it clean and well-formatted).
        2. newAtsScore: The new projected ATS score (e.g., 92).
        3. changesMade: An array of 3-5 strings explaining the specific improvements you made.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              improvedText: { type: Type.STRING },
              newAtsScore: { type: Type.NUMBER },
              changesMade: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["improvedText", "newAtsScore", "changesMade"],
          },
        },
      });

      const improvedData = JSON.parse(response.text || "{}");
      setImprovedResult(improvedData);
      setShowComparison(true);
    } catch (error) {
      console.error("Error improving resume:", error);
      alert("Failed to generate improved resume. Please try again.");
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display mb-4">
          Turn your existing resume into a job-winning resume with AI.
        </h1>
        <p className="text-slate-600 text-lg mb-6">
          Upload your resume and get a detailed ATS score, keyword analysis, and skill gap insights. With one click, generate an improved, ATS-friendly resume that is optimized for your target job role.
        </p>
        <ul className="space-y-3 mb-6">
          <li className="flex items-center gap-3 text-slate-700 font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            AI rewrites weak sections
          </li>
          <li className="flex items-center gap-3 text-slate-700 font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Adds missing keywords
          </li>
          <li className="flex items-center gap-3 text-slate-700 font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Improves formatting for ATS systems
          </li>
          <li className="flex items-center gap-3 text-slate-700 font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Highlights achievements with impact
          </li>
          <li className="flex items-center gap-3 text-slate-700 font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Increases your chances of getting shortlisted
          </li>
        </ul>
        <p className="text-slate-800 font-bold text-lg">
          See your resume transform from average to professional — instantly.
        </p>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload Resume (PDF, DOCX, TXT) or Paste Text
            </label>
            <div className="flex items-center justify-center w-full relative">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {extracting ? (
                    <Loader2 className="w-8 h-8 text-blue-500 mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  )}
                  <p className="text-sm text-slate-500">
                    <span className="font-semibold">
                      {extracting ? "Extracting text..." : "Click to upload"}
                    </span>{" "}
                    {!extracting && "or drag and drop"}
                  </p>
                  <p className="text-xs text-slate-500">PDF, DOCX, or TXT</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFileChange}
                  disabled={extracting}
                />
              </label>
            </div>
          </div>

          <div>
            <textarea
              className="w-full h-48 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Or paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              disabled={extracting}
            />
          </div>

          <button
            onClick={() => analyzeResume(resumeText)}
            disabled={analyzing || extracting || !resumeText.trim()}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden shadow-sm hover:shadow-md"
          >
            {analyzing && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-blue-800 opacity-50 transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            )}
            <span className="relative z-10 flex items-center">
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing ({progress}%)...
                </>
              ) : (
                "Analyze Resume"
              )}
            </span>
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 font-display">
              Analysis Results
            </h2>

            <div className="flex items-center justify-center mb-10">
              <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-8 border-blue-50">
                <div
                  className="absolute inset-0 rounded-full border-8 border-blue-500"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${result.atsScore}%, 0 ${result.atsScore}%)`,
                  }}
                ></div>
                <div className="text-center">
                  <span className="text-4xl font-extrabold text-slate-900 font-display">
                    {result.atsScore}
                  </span>
                  <span className="block text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">
                    ATS Score
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <ScoreCard title="Keywords" score={result.keywordMatchScore} />
              <ScoreCard title="Skills" score={result.skillsScore} />
              <ScoreCard title="Experience" score={result.experienceStrength} />
              <ScoreCard title="Formatting" score={result.formattingScore} />
              <ScoreCard title="Grammar" score={result.grammarScore} />
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4 font-display">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Overall Feedback
                </h3>
                <p className="text-slate-600 bg-slate-50 p-5 rounded-2xl leading-relaxed">
                  {result.feedback}
                </p>
              </div>

              {result.weakPoints && result.weakPoints.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4 font-display">
                    <AlertCircle className="w-6 h-6 text-orange-500" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-3">
                    {result.weakPoints.map((point: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-slate-600 bg-orange-50/50 p-4 rounded-xl"
                      >
                        <span className="text-orange-500 mt-0.5">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.improvements && result.improvements.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4 font-display">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                    Suggested Action Items
                  </h3>
                  <ul className="space-y-3">
                    {result.improvements.map((item: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-slate-600 bg-emerald-50/50 p-4 rounded-xl"
                      >
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Generate Improved Resume Button */}
            {!showComparison && (
              <div className="mt-10 pt-8 border-t border-slate-100 flex justify-center">
                <button
                  onClick={generateImprovedResume}
                  disabled={isImproving}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isImproving ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Generating Top 1% Resume...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 text-yellow-300" />
                      Generate Improved Resume
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparison View */}
      {showComparison && improvedResult && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500 opacity-10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
                <div>
                  <h2 className="text-3xl font-extrabold font-display mb-2 flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-emerald-400" />
                    Resume Upgraded!
                  </h2>
                  <p className="text-slate-300 text-lg">We've optimized your resume to beat the ATS.</p>
                </div>
                
                <div className="flex items-center gap-6 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                  <div className="text-center">
                    <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Old Score</div>
                    <div className="text-3xl font-extrabold text-slate-300">{result.atsScore}%</div>
                  </div>
                  <ArrowRight className="w-8 h-8 text-slate-500" />
                  <div className="text-center">
                    <div className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-1">New Score</div>
                    <div className="text-4xl font-extrabold text-emerald-400">{improvedResult.newAtsScore}%</div>
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  Key Improvements Made
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {improvedResult.changesMade.map((change: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-200">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Side by Side Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Original Resume</h3>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">Before</span>
              </div>
              <div className="flex-1 bg-slate-50 p-6 rounded-xl overflow-y-auto max-h-[600px] whitespace-pre-wrap text-sm text-slate-600 font-mono leading-relaxed">
                {resumeText}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-md border border-emerald-200 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-5 rounded-full blur-2xl"></div>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 relative z-10">
                <h3 className="text-lg font-bold text-slate-900">Optimized Resume</h3>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> After
                </span>
              </div>
              <div className="flex-1 bg-emerald-50/30 p-6 rounded-xl overflow-y-auto max-h-[600px] whitespace-pre-wrap text-sm text-slate-800 font-mono leading-relaxed relative z-10 border border-emerald-100/50">
                {improvedResult.improvedText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ title, score }: { title: string; score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (s >= 60) return "text-orange-600 bg-orange-50 border-orange-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  return (
    <div className={`p-5 rounded-2xl border text-center shadow-sm ${getColor(score)}`}>
      <div className="text-3xl font-extrabold mb-1 font-display">{score}%</div>
      <div className="text-xs font-bold uppercase tracking-wider opacity-80">
        {title}
      </div>
    </div>
  );
}
