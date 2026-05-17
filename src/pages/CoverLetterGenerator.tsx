import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { FileText, Loader2, Copy, CheckCircle, Upload } from "lucide-react";
import { extractTextFromFile } from "../utils/fileExtractor";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default function CoverLetterGenerator() {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("Professional");
  const [generating, setGenerating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setExtracting(true);

      try {
        const text = await extractTextFromFile(selectedFile);
        setResume(text);
      } catch (error: any) {
        alert(error.message || "Failed to extract text from file.");
      } finally {
        setExtracting(false);
      }
    }
  };

  const generateCoverLetter = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      alert("Please provide both your resume and the job description.");
      return;
    }

    setGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Write a ${tone.toLowerCase()} and compelling cover letter based on the following resume and job description.
        Make it engaging, highlight the most relevant skills and experiences from the resume that match the job description, and keep it under 400 words.
        Do not use placeholder brackets like [Your Name] if the information is available in the resume. If not, use standard placeholders.
        
        Tone: ${tone}
        
        Resume:
        ${resume}
        
        Job Description:
        ${jobDescription}`,
      });

      setCoverLetter(response.text || "");
    } catch (error) {
      console.error("Error generating cover letter:", error);
      alert("Failed to generate cover letter. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 font-display">
        <FileText className="w-8 h-8 text-blue-600" />
        Cover Letter Generator
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload Resume (PDF, DOCX, TXT) or Paste Text
            </label>
            <div className="flex items-center justify-center w-full relative mb-4">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {extracting ? (
                    <Loader2 className="w-6 h-6 text-blue-500 mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  )}
                  <p className="text-sm text-slate-500">
                    <span className="font-semibold">
                      {extracting ? "Extracting text..." : "Click to upload"}
                    </span>{" "}
                    {!extracting && "or drag and drop"}
                  </p>
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
            <textarea
              className="w-full h-32 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm shadow-sm"
              placeholder="Or paste your resume content here..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              disabled={extracting}
            />
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Job Description
            </label>
            <textarea
              className="w-full h-48 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm shadow-sm mb-6"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />

            <label className="block text-sm font-medium text-slate-700 mb-3">
              Cover Letter Tone
            </label>
            <div className="flex flex-wrap gap-3">
              {["Professional", "Enthusiastic", "Concise", "Confident", "Creative"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    tone === t
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generateCoverLetter}
            disabled={
              generating ||
              extracting ||
              !resume.trim() ||
              !jobDescription.trim()
            }
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm hover:shadow-md"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Cover Letter...
              </>
            ) : (
              "Generate Cover Letter"
            )}
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100 flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900 font-display">
              Generated Cover Letter
            </h3>
            {coverLetter && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          {coverLetter ? (
            <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-y-auto whitespace-pre-wrap font-serif text-slate-800 leading-relaxed shadow-inner">
              {coverLetter}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <p className="font-medium">Your generated cover letter will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
