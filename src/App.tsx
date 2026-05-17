import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Pages
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import JobMatcher from "./pages/JobMatcher";
import InterviewPrep from "./pages/InterviewPrep";
import LinkedInOptimizer from "./pages/LinkedInOptimizer";
import GithubOptimizer from "./pages/GithubOptimizer";
import SkillGap from "./pages/SkillGap";
import CoverLetterGenerator from "./pages/CoverLetterGenerator";
import AchievementQuantifier from "./pages/AchievementQuantifier";
import Login from "./pages/Login";

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="resume-analyzer" element={<ResumeAnalyzer />} />
            <Route path="job-matcher" element={<JobMatcher />} />
            <Route path="interview" element={<InterviewPrep />} />
            <Route path="linkedin" element={<LinkedInOptimizer />} />
            <Route path="github" element={<GithubOptimizer />} />
            <Route path="skills" element={<SkillGap />} />
            <Route path="cover-letter" element={<CoverLetterGenerator />} />
            <Route path="quantifier" element={<AchievementQuantifier />} />
            {/* Add more routes here */}
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
