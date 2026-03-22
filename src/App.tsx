import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // ✅ Fixed: was 'motion/react'
import {
  RefreshCw,
  Clock,
  AlertCircle,
  ChevronRight,
  Share2,
  Bell,
  ExternalLink,
  Radio,
  Search,
  X,
  Calendar as CalendarIcon,
  Sparkles,
  Filter,
  ListFilter
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import { Calendar } from './components/Calendar';

// ✅ TypeScript Interfaces
interface LiveUpdate {
  id: string;
  link: string;
  postType: string;
  content: string;
  date: string;
  modified_gmt: string;
  title: string;
  shouldDisplayTitle: boolean;
}

interface ApiResponse {
  success: boolean;
  postName: string;
  newUpdates: number;
  newIds: number[];
  validUpdates: LiveUpdate[];
}

interface BlogPost {
  id: string;
  date: string;
  label: string;
  title: string;
  description: string;
  url: string;
}

// ✅ Blog Posts Data
const BLOG_POSTS: BlogPost[] = [
  {
    id: 'march-22',
    date: '2026-03-22',
    label: 'March 22',
    title: 'Iran war live: Trump threatens to attack power plants over Strait of Hormuz',
    description: 'Donald Trump threatens to ‘obliterate’ Iran’s power plants if it fails to open the Strait of Hormuz within 48 hours',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-trump-threatens-attacks-on-power-plants-over-hormuz-strait&auto=true'
  },
   {
    id: 'march-21',
    date: '2026-03-21',
    label: 'March 21',
    title: 'Iran war live: Trump says no ceasefire as Khamenei issues defiant message',
    description: 'Trump says Strait of Hormuz must be protected from Iranian attacks ‘by other nations who use it’.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-trump-says-other-nations-have-to-protect-hormuz-from-iran&auto=true'
  },
  {
    id: 'march-20',
    date: '2026-03-20',
    label: 'March 20',
    title: 'Iran war live: Tehran warns of intensified strikes if energy sites targeted',
    description: 'Iran strikes Israeli oil refinery in northern city of Haifa as Tehran launches attacks on regional energy facilities.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-tehran-warns-of-intensified-strikes-if-energy-sites-targeted&auto=true'
  },
  {
    id: 'march-19',
    date: '2026-03-19',
    label: 'March 19',
    title: 'Iran war live: Qatar, Saudi energy sites attacked; Riyadh says trust gone',
    description: 'Iranian strikes on Gulf energy come after Israel attacked Iran’s South Pars gasfield and navy assets in the north.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-qatar-saudi-energy-sites-attacked-riyadh-says-trust-gone&auto=true'
  },
  {
    id: 'march-18',
    date: '2026-03-18',
    label: 'March 18',
    title: 'Iran war live: Tehran mourns Larijani, Soleimani; 2 killed in Israel',
    description: 'Iran launches attacks on Israel, killing two, as Bahrain, Qatar, UAE, and Saudi Arabia intercept more missiles, drones.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-tehran-mourns-larijani-soleimani-two-killed-in-israel&auto=true'
  },
  {
    id: 'march-17',
    date: '2026-03-17',
    label: 'March 17',
    title: 'Iran War Live: Trump scolds allies for not joining Strait of Hormuz mission',
    description: 'Latest updates as President Trump criticizes international partners for their reluctance to join the maritime security mission in the Gulf.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-trump-scolds-allies-for-not-joining-strait-of-hormuz-mission&auto=true'
  },
  {
    id: 'march-16',
    date: '2026-03-16',
    label: 'March 16',
    title: 'Iran War Live: Tehran rejects Trump claim on talks, Gulf attacks continue',
    description: 'Tensions remain high as Tehran dismisses US overtures while military actions in the Gulf region persist. Stay updated with live reports.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-tehran-rejects-trump-claim-on-talks-gulf-attacks-continue&auto=true'
  },
  {
    id: 'march-15',
    date: '2026-03-15',
    label: 'March 15',
    title: 'Iran War Live: Trump urges world to keep Hormuz Strait open',
    description: 'Follow the latest developments as tensions escalate in the Middle East. Our team provides real-time updates, analysis, and reactions from across the globe.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-trump-urges-world-to-keep-hormuz-strait-open&auto=true'
  },
  {
    id: 'march-14',
    date: '2026-03-14',
    label: 'March 14',
    title: 'Iran War Live: Pentagon vows to ramp up US military campaign',
    description: 'Archive coverage from March 14: Pentagon officials signal a significant escalation in military operations.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-pentagon-vows-to-ramp-up-us-military-campaign-against-iran&auto=true'
  },
  {
    id: 'march-13',
    date: '2026-03-13',
    label: 'March 13',
    title: 'Iran War Live: Trump says war going well amid wave of attacks',
    description: 'Archive coverage from March 13: President Trump provides an optimistic assessment despite ongoing Gulf attacks.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-trump-says-war-going-well-as-gulf-under-wave-of-attacks&auto=true'
  },
  {
    id: 'march-12',
    date: '2026-03-12',
    label: 'March 12',
    title: 'Iran War Live: Oil tankers hit in Iraq, Tehran sets peace conditions',
    description: 'Archive coverage from March 12: New strikes on energy infrastructure as Tehran outlines its terms for de-escalation.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-oil-tankers-hit-in-iraq-tehran-sets-3-conditions-for-peace&auto=true'
  },
  {
    id: 'march-11',
    date: '2026-03-11',
    label: 'March 11',
    title: 'Iran War Live: Tehran claims US-Israel hit civilian sites',
    description: 'Archive coverage from March 11: Serious allegations of widespread civilian site targeting emerge from Tehran.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-tehran-says-us-israel-hit-nearly-10000-civilian-sites&auto=true'
  },
  {
    id: 'march-10',
    date: '2026-03-10',
    label: 'March 10',
    title: 'Iran War Live: Trump predicts quick end as casualties rise',
    description: 'Archive coverage from March 10: High-level predictions of a short conflict contrast with reports of casualties in Tehran.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-trump-says-conflict-will-be-over-soon-40-killed-in-tehran&auto=true'
  },
  {
    id: 'march-09',
    date: '2026-03-09',
    label: 'March 09',
    title: 'Iran War Live: Mojtaba Khamenei named Supreme Leader',
    description: 'Archive coverage from March 09: Major political shift in Tehran as Mojtaba Khamenei succeeds while strikes continue.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-mojtaba-khamenei-named-supreme-leader-israel-bombs-tehran&auto=true'
  },
  {
    id: 'march-08',
    date: '2026-03-08',
    label: 'March 08',
    title: 'Iran Live: Israel bombs Tehran oil depots',
    description: 'Archive coverage from March 08: Strategic infrastructure targeted as regional instability grows.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-live-israel-bombs-tehran-oil-depots-attacks-on-gulf-states-continue&auto=true'
  },
  {
    id: 'march-07',
    date: '2026-03-07',
    label: 'March 07',
    title: 'Iran War Live: Trump demands unconditional surrender',
    description: 'Archive coverage from March 07: US President takes a hardline stance on negotiations.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-war-live-trump-says-no-deal-with-iran-until-unconditional-surrender&auto=true'
  },
  {
    id: 'march-06',
    date: '2026-03-06',
    label: 'March 06',
    title: 'Iran Live: Trump says Iran being demolished',
    description: 'Archive coverage from March 06: Rhetoric intensifies as military pressure on Tehran reaches new heights.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-live-trump-says-iran-being-demolished-tehran-keeps-up-gulf-attacks&auto=true'
  },
  {
    id: 'march-05',
    date: '2026-03-05',
    label: 'March 05',
    title: 'Iran Live: US Senate backs attacks on Tehran',
    description: 'Archive coverage from March 05: Legislative support for military action as Israel expands operations.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-live-us-senate-backs-trumps-attacks-on-tehran-israel-pounds-lebanon&auto=true'
  },
  {
    id: 'march-04',
    date: '2026-03-04',
    label: 'March 04',
    title: 'Iran Live: US Embassy in Dubai hit',
    description: 'Archive coverage from March 04: Conflict spreads to neighboring states with attacks in Dubai and Beirut.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-live-news-us-embassy-in-dubai-hit-israel-pounds-tehran-beirut&auto=true'
  },
  {
    id: 'march-03',
    date: '2026-03-03',
    label: 'March 03',
    title: 'Iran Live: Israel bombs Tehran and Beirut',
    description: 'Archive coverage from March 03: Trump predicts a four-week conflict as major cities face bombardment.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-live-news-israel-bombs-tehran-beirut-trump-says-war-to-last-4-weeks&auto=true'
  },
  {
    id: 'march-02',
    date: '2026-03-02',
    label: 'March 02',
    title: 'Iran War Live: US and Israel attack Iran',
    description: 'Archive coverage from March 02: The initial phase of the coordinated military campaign against Iran.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=us-israel-attack-iran-live&auto=true'
  },
  {
    id: 'march-01',
    date: '2026-03-01',
    label: 'March 01',
    title: 'Iran War Live: Regional tensions reach breaking point',
    description: 'Archive coverage from March 01: Diplomatic efforts fail as military posturing intensifies across the region.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=iran-live-news-israel-bombs-tehran-beirut-trump-says-war-to-last-4-weeks&auto=true'
  },
  {
    id: 'feb-28',
    date: '2026-02-28',
    label: 'Feb 28',
    title: 'Live: Israel launches attacks on Iran',
    description: 'Archive coverage from Feb 28: First reports of explosions in Tehran as hostilities commence.',
    url: 'https://aljazeera-liveblog-api.vercel.app/?postName=live-israel-launches-attacks-on-iran-multiple-explosions-heard-in-tehran&auto=true'
  }
];

const ITEMS_PER_PAGE = 5;

// ============================================================================
// ✅ COMPONENTS (Memoized for Performance)
// ============================================================================

const NewsUpdateCard = React.memo(({
  update,
  index,
  searchQuery,
  formatUpdateDate,
  highlightText,
  processContent
}: {
  update: LiveUpdate;
  index: number;
  searchQuery: string;
  formatUpdateDate: (date: string) => { relative: string; exact: string };
  highlightText: (text: string, query: string) => string;
  processContent: (content: string) => string;
}) => {
  const { relative, exact } = formatUpdateDate(update.date);

  return (
    <motion.article
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className="relative pl-8 md:pl-12 pb-12 group"
    >
      {/* Timeline Dot */}
      <div className="absolute left-0 top-1.5 w-6 h-6 md:w-8 md:h-8 rounded-full bg-white border-2 border-orange-600 z-10 flex items-center justify-center group-hover:scale-110 transition-transform">
        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-orange-600" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span title={exact}>{relative}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <a
              href={`https://www.aljazeera.com${update.link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 md:p-8">
          {update.shouldDisplayTitle && update.title && (
            <h3
              className="text-xl md:text-2xl font-bold text-gray-900 mb-4 leading-snug"
              dangerouslySetInnerHTML={{ __html: highlightText(update.title, searchQuery) }}
            />
          )}
          <div
            className="prose prose-orange max-w-none text-gray-700 leading-relaxed
              prose-p:mb-4 prose-p:last:mb-0
              prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900 prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: processContent(update.content) }}
          />
        </div>
      </div>
    </motion.article>
  );
});
NewsUpdateCard.displayName = 'NewsUpdateCard';

const CalendarModal = React.memo(({
  isOpen,
  onClose,
  availableDates,
  selectedDate,
  onDateSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  availableDates: string[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Archive Calendar</h3>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">Select a date to view coverage</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6">
            <Calendar
              availableDates={availableDates}
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
            />
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Live News Pulse Archive &bull; 2026
            </p>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
));
CalendarModal.displayName = 'CalendarModal';

const SuggestionsDropdown = React.memo(({
  isOpen,
  suggestions,
  recentSearches,
  onSelect
}: {
  isOpen: boolean;
  suggestions: string[];
  recentSearches: string[];
  onSelect: (s: string) => void;
}) => (
  <AnimatePresence>
    {isOpen && suggestions.length > 0 && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-[60] overflow-hidden"
      >
        <div className="p-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelect(s)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 text-left rounded-xl transition-colors group"
            >
              {recentSearches.includes(s) ? (
                <Clock className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
              ) : (
                <Search className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
              )}
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-900">
                {s}
              </span>
              {recentSearches.includes(s) && (
                <span className="ml-auto text-[10px] font-bold text-gray-300 uppercase tracking-widest">Recent</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
));
SuggestionsDropdown.displayName = 'SuggestionsDropdown';

const FiltersPanel = React.memo(({
  isOpen,
  selectedPostType,
  setSelectedPostType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onReset
}: {
  isOpen: boolean;
  selectedPostType: string;
  setSelectedPostType: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onReset: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Post Type</label>
            <select
              value={selectedPostType}
              onChange={(e) => setSelectedPostType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
            >
              <option value="all">All Types</option>
              <option value="breaking">Breaking</option>
              <option value="analysis">Analysis</option>
              <option value="report">Report</option>
              <option value="post">Standard Post</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Start Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">End Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="sm:col-span-3 flex justify-end gap-3 pt-2 border-t border-gray-50">
            <button
              onClick={onReset}
              className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
            >
              Reset All
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
));
FiltersPanel.displayName = 'FiltersPanel';

const AIAnalysisSection = React.memo(({
  searchQuery,
  isAnalyzing,
  analysis,
  analysisType,
  filteredUpdates,
  analyzeSearch,
  setAnalysis
}: {
  searchQuery: string;
  isAnalyzing: boolean;
  analysis: string | null;
  analysisType: string;
  filteredUpdates: LiveUpdate[];
  analyzeSearch: (type: 'smart' | 'daily' | 'weekly' | 'data') => void;
  setAnalysis: (val: string | null) => void;
}) => (
  <AnimatePresence mode="popLayout">
    {searchQuery.trim() && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-8 bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-2xl p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-orange-800">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold">AI Archive Analysis</h3>
          </div>
          <div className="flex items-center gap-2">
            {!analysis && !isAnalyzing ? (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => analyzeSearch('smart')}
                  className="text-[10px] font-bold bg-white text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors shadow-sm uppercase tracking-wider"
                >
                  Smart Summary
                </button>
                <button
                  onClick={() => analyzeSearch('daily')}
                  className="text-[10px] font-bold bg-white text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors shadow-sm uppercase tracking-wider"
                >
                  Daily Report
                </button>
                <button
                  onClick={() => analyzeSearch('weekly')}
                  className="text-[10px] font-bold bg-white text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors shadow-sm uppercase tracking-wider"
                >
                  Weekly Report
                </button>
                <button
                  onClick={() => analyzeSearch('data')}
                  className="text-[10px] font-bold bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition-colors shadow-sm uppercase tracking-wider"
                >
                  Data Extraction
                </button>
              </div>
            ) : analysis && (
              <button
                onClick={() => setAnalysis(null)}
                className="text-[10px] font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors uppercase tracking-wider"
              >
                New Analysis
              </button>
            )}
          </div>
        </div>

        {isAnalyzing ? (
          <div className="flex items-center gap-3 text-orange-600 py-4">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Generating {analysisType} report for "{searchQuery}"...</span>
          </div>
        ) : analysis ? (
          <div className="prose prose-sm prose-orange max-w-none overflow-x-auto">
            <div className="text-gray-700 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
            </div>
            <div className="mt-6 pt-4 border-t border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-orange-400 uppercase tracking-widest font-bold">AI {analysisType} Report</span>
                <span className="text-[10px] text-gray-300">•</span>
                <span className="text-[10px] text-gray-400 font-medium">Based on {filteredUpdates.length} matching updates</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-orange-700/70">
            Select a report type to analyze how "{searchQuery.toUpperCase()}" has evolved across the full archive.
          </p>
        )}
      </motion.div>
    )}
  </AnimatePresence>
));
AIAnalysisSection.displayName = 'AIAnalysisSection';

const Header = React.memo(({
  isAutoRefreshing,
  lastUpdated,
  isRefreshing,
  onShowCalendar,
  onSync
}: {
  isAutoRefreshing: boolean;
  lastUpdated: Date;
  isRefreshing: boolean;
  onShowCalendar: () => void;
  onSync: () => void;
}) => (
  <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 md:px-8">
    <div className="max-w-5xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-orange-600 p-1.5 rounded-lg">
          <Radio className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 leading-tight">
            Live News Pulse
          </h1>
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium uppercase tracking-wider text-orange-600 transition-all duration-300">
            {isAutoRefreshing ? (
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
            ) : (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
              </span>
            )}
            <span className={cn(isAutoRefreshing && "animate-pulse")}>
              {isAutoRefreshing ? 'Syncing...' : 'Live Updates'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onShowCalendar}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-orange-600"
          title="View Archive Calendar"
        >
          <CalendarIcon className="w-5 h-5" />
        </button>
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Last Sync</span>
          <span className="text-xs font-mono text-gray-600">{format(lastUpdated, 'HH:mm:ss')}</span>
        </div>
        <button
          onClick={onSync}
          disabled={isRefreshing}
          className={cn(
            "p-2 rounded-full hover:bg-gray-100 transition-all active:scale-95",
            isRefreshing && "animate-spin text-orange-600"
          )}
          title="Refresh updates"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <button className="hidden sm:flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
          <Bell className="w-4 h-4" />
          Notify Me
        </button>
      </div>
    </div>
  </header>
));
Header.displayName = 'Header';

const DateFilterSlider = React.memo(({
  selectedPost,
  onSelectPost
}: {
  selectedPost: BlogPost;
  onSelectPost: (post: BlogPost) => void;
}) => (
  <div className="mb-10 flex flex-col sm:flex-row sm:items-center gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <div className="flex items-center gap-3 shrink-0">
      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
        <CalendarIcon className="w-5 h-5 text-orange-600" />
      </div>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-0.5">Archive Timeline</span>
        <span className="text-xl font-black text-orange-600 tracking-tight">{selectedPost.label}</span>
      </div>
    </div>
    <div className="flex-1 px-2">
      <input
        type="range"
        min="0"
        max={BLOG_POSTS.length - 1}
        step="1"
        value={BLOG_POSTS.length - 1 - BLOG_POSTS.findIndex(p => p.id === selectedPost.id)}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          const index = (BLOG_POSTS.length - 1) - val;
          onSelectPost(BLOG_POSTS[index]);
        }}
        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-600 hover:accent-orange-700 transition-all"
      />
      <div className="flex justify-between mt-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{BLOG_POSTS[BLOG_POSTS.length - 1].label}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{BLOG_POSTS[0].label}</span>
      </div>
    </div>
  </div>
));
DateFilterSlider.displayName = 'DateFilterSlider';

// ============================================================================
// ✅ MAIN APP COMPONENT
// ============================================================================

export default function App() {
  const [selectedPost, setSelectedPost] = useState<BlogPost>(BLOG_POSTS[0]);
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUpdates, setAllUpdates] = useState<LiveUpdate[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<'smart' | 'daily' | 'weekly' | 'data'>('smart');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // ✅ Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, []);

  // ✅ Save search to recent
  const saveSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // ✅ Generate suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions(recentSearches);
      return;
    }
    const query = searchQuery.toLowerCase();
    const keywords = new Set<string>();
    
    allUpdates.forEach(u => {
      u.title.split(/\s+/).forEach(word => {
        const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (clean.length > 3) keywords.add(clean);
      });
      ['trump', 'tehran', 'israel', 'iran', 'hormuz', 'pentagon', 'biden', 'netanyahu', 'gaza', 'lebanon'].forEach(entity => {
        if (entity.includes(query)) keywords.add(entity);
      });
    });

    const filtered = Array.from(keywords)
      .filter(k => k.includes(query))
      .sort((a, b) => {
        if (a.startsWith(query) && !b.startsWith(query)) return -1;
        if (!a.startsWith(query) && b.startsWith(query)) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 8);
    
    setSuggestions(filtered);
  }, [searchQuery, allUpdates, recentSearches]);

  // ✅ AI Analysis Function
  const analyzeSearch = async (type: 'smart' | 'daily' | 'weekly' | 'data' = 'smart') => {
    if (!searchQuery.trim()) return;
    
    // ✅ Check for API key
    if (!process.env.GEMINI_API_KEY) {
      setAnalysis("⚠️ GEMINI_API_KEY not configured. Please set your environment variable.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setAnalysisType(type);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      if (filteredUpdates.length === 0) {
        setAnalysis(`No matching updates for "${searchQuery}" were found in the archive.\n\nTry searching for a broader term or a specific location/person involved in the conflict.`);
        setIsAnalyzing(false);
        return;
      }

      const limit = type === 'smart' ? 10 : 35;
      const context = filteredUpdates.slice(0, limit).map(u => ({
        date: u.date,
        title: u.title,
        content: u.content.replace(/<[^>]*>?/gm, '').substring(0, 500)
      }));

      let prompt = "";
      if (type === 'smart') {
        prompt = `You are a senior geopolitical analyst.
Analyze the following news updates related to the search query: "${searchQuery}".
Provide a concise, "smart" summary (max 3 bullet points) of the situation based ONLY on these updates.
Focus on the role or impact of "${searchQuery}" in the current conflict.`;
      } else if (type === 'daily') {
        prompt = `You are a senior geopolitical analyst.
Generate a "Daily Report" for the keyword: "${searchQuery}".
Based on the provided updates, summarize the key events that occurred TODAY or in the most recent 24-hour period regarding "${searchQuery}".
Focus on immediate developments, military movements, and official statements.`;
      } else if (type === 'weekly') {
        prompt = `You are a senior geopolitical analyst.
Generate a "Weekly Strategic Report" for the keyword: "${searchQuery}".
Analyze the progression of events over the past week based on these updates.
Identify trends, shifts in strategy, and the broader implications for the region.
Provide a strategic outlook.`;
      } else if (type === 'data') {
        prompt = `You are a data extraction and fact-checking specialist.
The user is asking a specific question or looking for data: "${searchQuery}".
Scan the provided updates for specific numbers, statistics, casualty counts, or verified facts that answer this query.
Provide a clear, direct answer. If numbers have changed over time, show the progression.
If there are conflicting reports, list them with their respective dates.
Be precise and objective.`;
      }

      prompt += `
Updates:
${JSON.stringify(context)}
Format: Return ONLY the report in markdown format. Use a professional, analytical tone. Include a clear header for the report type.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash", // ✅ Updated model name (gemini-3 doesn't exist yet)
        contents: prompt,
      });

      setAnalysis(response.text);
    } catch (err) {
      console.error("Analysis failed:", err);
      setAnalysis("Failed to generate analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ✅ Fetch all updates for global search
  const fetchAllUpdates = useCallback(async () => {
    setIsSearching(true);
    try {
      const results = await Promise.all(
        BLOG_POSTS.map(async (post) => {
          try {
            const res = await fetch(post.url);
            const data: ApiResponse = await res.json();
            return data.success ? data.validUpdates : [];
          } catch {
            return [];
          }
        })
      );
      const merged = results.flat().sort((a, b) => {
        const dateA = new Date(a.date.endsWith('Z') ? a.date : `${a.date}Z`).getTime();
        const dateB = new Date(b.date.endsWith('Z') ? b.date : `${b.date}Z`).getTime();
        return dateB - dateA;
      });
      setAllUpdates(merged);
    } catch (err) {
      console.error('Error fetching all updates for search:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // ✅ Sync updates for current post
  const syncUpdates = useCallback(async (isAuto = false, post = selectedPost) => {
    if (!isAuto) setIsRefreshing(true);
    else setIsAutoRefreshing(true);

    try {
      const response = await fetch(post.url);
      if (!response.ok) throw new Error('Failed to fetch updates');
      
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        const sortedUpdates = data.validUpdates.sort((a, b) => {
          const dateA = new Date(a.date.endsWith('Z') ? a.date : `${a.date}Z`).getTime();
          const dateB = new Date(b.date.endsWith('Z') ? b.date : `${b.date}Z`).getTime();
          return dateB - dateA;
        });
        setUpdates(sortedUpdates);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error('API returned unsuccessful status');
      }
    } catch (err) {
      console.error('Error fetching updates:', err);
      setError('Could not load updates. Please try again later.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setIsAutoRefreshing(false);
    }
  }, [selectedPost]);

  // ✅ Initial load effect
  useEffect(() => {
    setLoading(true);
    syncUpdates(false, selectedPost);
    fetchAllUpdates();
  }, [selectedPost, syncUpdates, fetchAllUpdates]);

  // ✅ Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => syncUpdates(true), 30000);
    return () => clearInterval(interval);
  }, [syncUpdates]);

  // ✅ Format date helper
  const formatUpdateDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`);
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        exact: format(date, 'HH:mm MMM d, yyyy')
      };
    } catch {
      return { relative: 'Recently', exact: '' };
    }
  };

  // ✅ Highlight search query in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? `<mark class="bg-orange-100 text-orange-900 rounded-sm px-0.5 font-bold">${part}</mark>`
        : part
    ).join('');
  };

  // ✅ Process content: fix URLs, images, links, highlight
  const processContent = (content: string) => {
    if (!content) return '';
    
    let processed = content.replace(
      /([ "])\/wp-content\//g,
      '$1https://www.aljazeera.com/wp-content/'
    );

    processed = processed.replace(/<img([^>]+)>/g, (match, attributes) => {
      let cleanAttrs = attributes
        .replace(/\s+(width|height|style|class)="[^"]*"/g, '')
        .trim();
      
      cleanAttrs = cleanAttrs.replace(/(src|srcset)="\/([^"]+)"/g, '$1="https://www.aljazeera.com/$2"');
      
      if (cleanAttrs.includes('srcset="')) {
        cleanAttrs = cleanAttrs.replace(/srcset="([^"]+)"/g, (m: string, p1: string) => {
          const fixed = p1.split(',').map((part: string) => {
            const trimmed = part.trim();
            if (trimmed.startsWith('/')) {
              return `https://www.aljazeera.com${trimmed}`;
            }
            return trimmed;
          }).join(', ');
          return `srcset="${fixed}"`;
        });
      }
      
      return `<img ${cleanAttrs} loading="lazy" decoding="async" sizes="(max-width: 768px) 92vw, 824px" referrerpolicy="no-referrer" class="max-w-[92%] aspect-video object-cover rounded-xl my-8 shadow-lg border border-gray-100 block !mx-auto">`;
    });

    processed = processed.replace(
      /href="\/([^">]+)"/g,
      'href="https://www.aljazeera.com/$1" target="_blank" rel="noopener noreferrer"'
    );

    if (searchQuery.trim()) {
      const regex = new RegExp(`(${searchQuery})`, 'gi');
      processed = processed.split(/(<[^>]+>)/).map(part => {
        if (part.startsWith('<')) return part;
        return part.replace(regex, '<mark class="bg-orange-100 text-orange-900 rounded-sm px-0.5 font-bold">$1</mark>');
      }).join('');
    }

    return processed;
  };

  // ✅ Filtered updates with memoization
  const filteredUpdates = useMemo(() => {
    const isGlobalFilterActive = searchQuery.trim() || selectedPostType !== 'all' || startDate || endDate;
    const baseUpdates = isGlobalFilterActive ? allUpdates : updates;

    return baseUpdates.filter(u => {
      const matchesSearch = !searchQuery.trim() ||
        u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedPostType === 'all' || u.postType.toLowerCase() === selectedPostType.toLowerCase();
      
      const updateDate = new Date(u.date).getTime();
      const matchesStart = !startDate || updateDate >= new Date(startDate).getTime();
      const matchesEnd = !endDate || updateDate <= new Date(endDate).getTime() + 86400000;

      return matchesSearch && matchesType && matchesStart && matchesEnd;
    });
  }, [searchQuery, selectedPostType, startDate, endDate, allUpdates, updates]);

  // ✅ Reset analysis when search changes
  useEffect(() => {
    setAnalysis(null);
  }, [searchQuery]);

  // ============================================================================
  // ✅ RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-orange-100">
      
      {/* Calendar Modal */}
      <CalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        availableDates={BLOG_POSTS.map(p => p.date)}
        selectedDate={selectedPost.date}
        onDateSelect={(date) => {
          const post = BLOG_POSTS.find(p => p.date === date);
          if (post) {
            setSelectedPost(post);
            setCurrentPage(1);
            setSearchQuery('');
            setShowCalendarModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      {/* Header */}
      <Header
        isAutoRefreshing={isAutoRefreshing}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onShowCalendar={() => setShowCalendarModal(true)}
        onSync={() => syncUpdates()}
      />

      <main className="max-w-5xl mx-auto px-4 py-8 md:px-8">
        
        {/* Date Filter Slider */}
        <DateFilterSlider
          selectedPost={selectedPost}
          onSelectPost={(post) => {
            setSelectedPost(post);
            setCurrentPage(1);
            setSearchQuery('');
          }}
        />

        {/* Hero Section */}
        <div className="mb-12 border-l-4 border-orange-600 pl-6 py-2">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            {searchQuery ? `Search Results for "${searchQuery}"` : selectedPost.title}
          </h2>
          <p className="text-gray-600 max-w-2xl text-lg leading-relaxed">
            {searchQuery 
              ? `Found ${filteredUpdates.length} updates across all archived dates matching your search.` 
              : selectedPost.description}
          </p>
        </div>

        {/* ✅ Content Grid - Sidebar NOW correctly inside grid container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Feed Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Search & Filters */}
            <div className="space-y-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search updates by keywords..."
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveSearch(searchQuery);
                      setShowSuggestions(false);
                    }
                  }}
                  className="w-full pl-12 pr-24 py-4 bg-white border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl text-lg shadow-sm transition-all placeholder:text-gray-400"
                />
                
                <SuggestionsDropdown 
                  isOpen={showSuggestions}
                  suggestions={suggestions}
                  recentSearches={recentSearches}
                  onSelect={(s) => {
                    setSearchQuery(s);
                    saveSearch(s);
                    setShowSuggestions(false);
                  }}
                />
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-wider",
                      showFilters ? "bg-orange-100 text-orange-600" : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filters</span>
                  </button>
                </div>
              </div>

              <FiltersPanel 
                isOpen={showFilters}
                selectedPostType={selectedPostType}
                setSelectedPostType={(val) => {
                  setSelectedPostType(val);
                  setCurrentPage(1);
                }}
                startDate={startDate}
                setStartDate={(val) => {
                  setStartDate(val);
                  setCurrentPage(1);
                }}
                endDate={endDate}
                setEndDate={(val) => {
                  setEndDate(val);
                  setCurrentPage(1);
                }}
                onReset={() => {
                  setSelectedPostType('all');
                  setStartDate('');
                  setEndDate('');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Loading / Error / Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="w-10 h-10 text-orange-600 animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Loading live feed...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-900 mb-2">Connection Error</h3>
                <p className="text-red-700 mb-6">{error}</p>
                <button 
                  onClick={() => syncUpdates()}
                  className="bg-red-600 text-white px-6 py-2 rounded-full font-medium hover:bg-red-700 transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 ml-[11px] md:ml-[15px]" />
                
                <AIAnalysisSection 
                  searchQuery={searchQuery}
                  isAnalyzing={isAnalyzing}
                  analysis={analysis}
                  analysisType={analysisType}
                  filteredUpdates={filteredUpdates}
                  analyzeSearch={analyzeSearch}
                  setAnalysis={setAnalysis}
                />

                <AnimatePresence mode="popLayout">
                  {filteredUpdates
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((update, index) => (
                      <NewsUpdateCard 
                        key={update.id}
                        update={update}
                        index={index}
                        searchQuery={searchQuery}
                        formatUpdateDate={formatUpdateDate}
                        highlightText={highlightText}
                        processContent={processContent}
                      />
                    ))}
                </AnimatePresence>

                {filteredUpdates.length === 0 && !loading && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                      We couldn't find any updates matching "{searchQuery}". Try using different keywords.
                    </p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-6 text-orange-600 font-bold hover:text-orange-700 underline underline-offset-4"
                    >
                      Clear search
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {filteredUpdates.length > ITEMS_PER_PAGE && (
                  <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setCurrentPage(prev => Math.max(prev - 1, 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.ceil(filteredUpdates.length / ITEMS_PER_PAGE) }).map((_, i) => {
                          const pageNum = i + 1;
                          const totalPages = Math.ceil(filteredUpdates.length / ITEMS_PER_PAGE);
                          
                          if (
                            pageNum === 1 || 
                            pageNum === totalPages || 
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => {
                                  setCurrentPage(pageNum);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={cn(
                                  "w-10 h-10 rounded-lg border text-sm font-bold transition-all",
                                  currentPage === pageNum 
                                    ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-200" 
                                    : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                                )}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                          if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                            return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        onClick={() => {
                          setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredUpdates.length / ITEMS_PER_PAGE)));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === Math.ceil(filteredUpdates.length / ITEMS_PER_PAGE)}
                        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                      <span>Jump to page</span>
                      <input 
                        type="number" 
                        min="1"
                        max={Math.ceil(filteredUpdates.length / ITEMS_PER_PAGE)}
                        value={currentPage}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const max = Math.ceil(filteredUpdates.length / ITEMS_PER_PAGE);
                          if (!isNaN(val) && val >= 1 && val <= max) {
                            setCurrentPage(val);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-bold text-gray-900"
                      />
                      <span>of {Math.ceil(filteredUpdates.length / ITEMS_PER_PAGE)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div> {/* ✅ Closes Main Feed Column */}

          {/* ✅ Sidebar Column - NOW correctly inside grid container */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Calendar Widget */}
            <Calendar 
              availableDates={BLOG_POSTS.map(p => p.date)}
              selectedDate={selectedPost.date}
              onDateSelect={(date) => {
                const post = BLOG_POSTS.find(p => p.date === date);
                if (post) {
                  setSelectedPost(post);
                  setCurrentPage(1);
                  setSearchQuery('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />

            {/* Key Events Widget */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-24">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Radio className="w-4 h-4 text-orange-600" />
                Key Developments
              </h3>
              <div className="space-y-4">
                {filteredUpdates.slice(0, 5).map((update) => (
                  <div key={`sidebar-${update.id}`} className="group cursor-pointer">
                    <div className="flex gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-600 shrink-0 group-hover:scale-150 transition-transform" />
                      <div>
                        <p className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {update.title || "New Update Received"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase">
                          {format(new Date(update.date.endsWith('Z') ? update.date : `${update.date}Z`), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="bg-orange-50 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-orange-800 uppercase mb-2">Live Coverage</h4>
                  <p className="text-xs text-orange-700 leading-relaxed">
                    Our correspondents are monitoring the situation 24/7. Stay tuned for verified reports.
                  </p>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-gray-900 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-2">Stay Informed</h3>
              <p className="text-sm text-gray-400 mb-4">Get breaking news alerts delivered to your inbox.</p>
              <div className="space-y-2">
                <input 
                  type="email" 
                  placeholder="your@email.com" 
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </aside> {/* ✅ Closes Sidebar */}
          
        </div> {/* ✅ CORRECTLY CLOSES GRID CONTAINER */}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-20">
        <div className="max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-gray-900 p-1 rounded">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Live News Pulse</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">About</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-gray-400 font-mono">
            &copy; {new Date().getFullYear()} Live News Pulse. Data via Al Jazeera.
          </p>
        </div>
      </footer>
    </div>
  );
}
