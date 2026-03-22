'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type UploadStep = 1 | 2 | 3;

const CATEGORIES = ['Self-Help', 'Business', 'Philosophy', 'Relationships', 'Psychology', 'Spirituality', 'Leadership', 'Communication', 'Negotiation'];
const COVER_COLORS = [
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', // Blue
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Pink/Orange
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple
  'linear-gradient(135deg, #111111 0%, #444444 100%)', // Dark Gray
  'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', // Light Gray
];
const PRICES = [
  { label: 'Free', value: 0 },
  { label: '$9', value: 900 },
  { label: '$19', value: 1900 },
  { label: '$29', value: 2900 },
  { label: '$49', value: 4900 },
  { label: '$97', value: 9700 },
];

export default function AuthorUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<UploadStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [price, setPrice] = useState(0);
  const [copyright, setCopyright] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  
  const [processingStatus, setProcessingStatus] = useState('');
  const [createdBookId, setCreatedBookId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Quick auth check
    getCurrentUser().then(user => {
      if (!user) router.push('/login');
    });
  }, [router]);

  const handleNextStep1 = () => {
    if (!title || !authorName || !description) {
      setError('Title, Author Name, and Description are required.');
      return;
    }
    if (!copyright) {
      setError('You must declare copyright ownership to proceed.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit.');
        return;
      }
      if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
        setError('Only PDF files are supported.');
        return;
      }
      setFile(selected);
      setPasteText(''); // Clear text if file selected
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file && !pasteText.trim()) {
      setError('Please provide a PDF file or paste your manuscript text.');
      return;
    }
    setError(null);
    setStep(3);
    setLoading(true);
    setProcessingStatus('AI is reading your book and creating your companion experience... (this takes 2-3 minutes)');

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('subtitle', subtitle);
      formData.append('author', authorName);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('coverColor', coverColor);
      formData.append('price', price.toString());
      formData.append('authorId', user.id);
      
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', pasteText);
      }

      const res = await fetch('/api/author/process-book', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process book');

      setCreatedBookId(data.bookId);
      setProcessingStatus('Done');
    } catch (err: any) {
      console.error('Upload Error:', err);
      setError(err.message || 'An error occurred during upload.');
      setStep(2); // Go back on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-navy text-ink pb-24">
      <nav className="px-6 py-4 flex items-center justify-between max-w-2xl mx-auto border-b border-ink/10">
        <Link href="/author" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center text-ink font-bold text-sm" style={{ fontFamily: "'Cormorant Garamond', serif" }}>A</div>
          <span className="text-sm font-medium tracking-wide text-ink/80">AUTHOR PORTAL</span>
        </Link>
        <Link href="/author" className="text-xs text-ink/40 hover:text-ink/70 transition-colors flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5m7 7-7-7 7-7"/></svg>
          Dashboard
        </Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 pt-12">
        {step < 3 && (
          <div className="flex gap-2 mb-10">
            {[1, 2].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? 'bg-gold' : 'bg-ink/10'}`} />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>{error}</p>
          </div>
        )}

        {/* STEP 1: Book Details */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold mb-2 text-ink/90" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Book Details</h1>
              <p className="text-sm text-ink/40 mb-8">Tell us about your book. This is what readers will see in the library.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Title <span className="text-red-400">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Atomic Habits" className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink/90 placeholder:text-ink/25 outline-none focus:border-gold/40 transition-colors" />
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Subtitle (Optional)</label>
                <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="e.g. An Easy & Proven Way to Build Good Habits..." className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink/90 placeholder:text-ink/25 outline-none focus:border-gold/40 transition-colors" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Author Name <span className="text-red-400">*</span></label>
                <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Your Pen Name" className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink/90 placeholder:text-ink/25 outline-none focus:border-gold/40 transition-colors" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Category <span className="text-red-400">*</span></label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-navy border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink/90 outline-none focus:border-gold/40 transition-colors appearance-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Price <span className="text-red-400">*</span></label>
                <select value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-navy border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink/90 outline-none focus:border-gold/40 transition-colors appearance-none">
                  {PRICES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Description <span className="text-red-400">*</span></label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="What is your book about? Why should people read it?" className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink/90 placeholder:text-ink/25 outline-none focus:border-gold/40 transition-colors resize-none" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-3">Cover Color Theme</label>
                <div className="flex gap-3 flex-wrap">
                  {COVER_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCoverColor(c)}
                      className={`w-12 h-16 rounded-md transition-all ${coverColor === c ? 'ring-2 ring-gold ring-offset-2 ring-offset-navy scale-110' : 'opacity-70 hover:opacity-100'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-6 pb-2 border-t border-ink/10 mt-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                    <input type="checkbox" checked={copyright} onChange={e => setCopyright(e.target.checked)} className="peer sr-only" />
                    <div className="w-5 h-5 border-2 border-ink/20 rounded peer-checked:bg-gold peer-checked:border-gold transition-colors flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-ink opacity-0 peer-checked:opacity-100 transition-opacity"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                  <span className="text-xs text-ink/60 leading-relaxed group-hover:text-ink/80 transition-colors">
                    <strong className="text-ink/90">Copyright Declaration:</strong> I confirm this is my original work and I own the rights to publish it. I understand that copyright infringement will result in immediate removal.
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={handleNextStep1}
                className="w-full bg-gold hover:bg-gold-light text-ink font-semibold px-6 py-4 rounded-xl transition-colors text-sm"
              >
                Continue to Upload
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Upload Content */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold mb-2 text-ink/90" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Upload Content</h1>
              <p className="text-sm text-ink/40 mb-8">Provide your manuscript. Our AI will automatically chapterize it and generate reflection questions.</p>
            </div>

            <div className="space-y-8">
              {/* File Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${file ? 'border-gold bg-gold/5' : 'border-ink/20 bg-ink/5 hover:border-gold/40 hover:bg-ink/10'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <div className="w-16 h-16 bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-4 text-ink/40">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                {file ? (
                  <div>
                    <p className="text-gold font-medium text-sm mb-1">{file.name}</p>
                    <p className="text-xs text-ink/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-ink/80 font-medium text-sm mb-1">Click to upload PDF</p>
                    <p className="text-xs text-ink/40">Up to 50MB</p>
                  </div>
                )}
              </div>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-ink/10"></div>
                <span className="shrink-0 mx-4 text-[10px] text-ink/30 uppercase tracking-wider font-semibold">OR</span>
                <div className="flex-grow border-t border-ink/10"></div>
              </div>

              {/* Text Paste Area */}
              <div>
                <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Paste your manuscript here</label>
                <textarea 
                  value={pasteText} 
                  onChange={e => { setPasteText(e.target.value); if (e.target.value) setFile(null); }} 
                  rows={8} 
                  placeholder="Paste your full text here. Include chapter headings like 'Chapter 1' or '1.' so we can detect them." 
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink/90 placeholder:text-ink/25 outline-none focus:border-gold/40 transition-colors"
                  disabled={!!file}
                />
              </div>
            </div>

            <div className="pt-8 flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="bg-ink/5 hover:bg-ink/10 text-white font-semibold px-6 py-4 rounded-xl transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={handleUpload}
                disabled={(!file && !pasteText.trim()) || loading}
                className="flex-1 bg-gold hover:bg-gold-light disabled:bg-ink/10 disabled:text-ink/40 text-ink font-semibold px-6 py-4 rounded-xl transition-colors text-sm"
              >
                Start AI Processing
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Processing / Done */}
        {step === 3 && (
          <div className="text-center py-16 animate-fade-in">
            {createdBookId ? (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h1 className="text-3xl font-bold mb-2 text-ink/90" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Your book is live!</h1>
                <p className="text-sm text-ink/40 max-w-sm mx-auto mb-8">
                  The AI has finished extracting chapters and creating the companion experience.
                </p>
                <div className="bg-ink/5 border border-ink/10 rounded-xl p-4 flex items-center justify-between max-w-sm mx-auto">
                  <span className="text-xs text-ink/60 truncate">loop-reader.vercel.app/book/{createdBookId}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(`https://loop-reader.vercel.app/book/${createdBookId}`)}
                    className="text-[11px] font-medium text-gold hover:text-gold-light px-3 py-1.5 bg-ink/5 rounded-md shrink-0"
                  >
                    Copy Link
                  </button>
                </div>
                <div className="pt-8 flex gap-4 justify-center">
                  <Link href={`/book/${createdBookId}`} className="bg-gold hover:bg-gold-light text-ink font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                    View in Library
                  </Link>
                  <Link href="/author" className="bg-ink/5 hover:bg-ink/10 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-gold/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-gold font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>AI</div>
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-3 text-ink/90" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Processing your book...</h2>
                  <p className="text-sm text-ink/50 max-w-sm mx-auto leading-relaxed">{processingStatus}</p>
                </div>
                
                <div className="max-w-sm mx-auto bg-ink/5 rounded-xl p-5 border border-ink/10 text-left">
                  <p className="text-[10px] font-semibold text-ink/40 uppercase tracking-wider mb-3">Behind the scenes</p>
                  <ul className="space-y-2 text-xs text-ink/60">
                    <li className="flex items-center gap-2"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg> Extracting text chapters</li>
                    <li className="flex items-center gap-2"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg> Generating AI reflections</li>
                    <li className="flex items-center gap-2"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg> Extracting core lessons</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}