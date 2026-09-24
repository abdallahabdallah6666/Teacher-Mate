import React, { useState } from 'react';
import { BLOG_POSTS } from '../data/blogPosts';
import { BlogPost } from '../types';
import { BookOpen, Calendar, Clock, ArrowLeft, ArrowRight, X } from 'lucide-react';

interface BlogSectionProps {
  isAr: boolean;
}

export const BlogSection: React.FC<BlogSectionProps> = ({ isAr }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  return (
    <section id="blog" className="py-16 bg-white text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-block px-3.5 py-1 bg-[#0D9488] text-white text-[11px] font-bold uppercase tracking-widest rounded-full shadow-sm">
            <span>{isAr ? 'المدونة البيداغوجية ودليل التحديثات' : 'Blog & Nouvelles Pédagogiques'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1E3A8A]">
            {isAr ? 'مقالات تربوية وإرشادات للمعلم الجزائري' : 'Articles & Conseils Pédagogiques'}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {isAr
              ? 'مقالات متجددة حول كيفية التخطيط التربوي، تقييم المكتسبات، واستغلال الذكاء الاصطناعي في التدريس الابتدائي.'
              : 'Guides pratiques pour l\'évaluation des acquis et l\'utilisation de l\'IA en classe.'}
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="bg-[#F8FAFC] border border-slate-200 hover:border-[#0D9488] rounded-lg overflow-hidden cursor-pointer transition-all duration-300 shadow-sm group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100 border-b border-slate-200">
                  <img
                    src={post.imageUrl}
                    alt={post.titleAr}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-[#0D9488] text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                    {post.category}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
                      {post.publishDate}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1E3A8A] group-hover:text-[#0D9488] transition-colors leading-snug">
                    {isAr ? post.titleAr : post.titleFr}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {isAr ? post.excerptAr : post.excerptFr}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center justify-between text-xs font-bold text-[#0D9488] group-hover:text-teal-700">
                <span>{isAr ? 'قراءة المقال كاملاً' : 'Lire l\'article'}</span>
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </div>
            </div>
          ))}
        </div>

        {/* Modal for full article reading */}
        {selectedPost && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 relative space-y-6 text-slate-800 shadow-xl">
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200">
                {selectedPost.category}
              </span>

              <h2 className="text-2xl font-bold text-[#1E3A8A] leading-tight">
                {isAr ? selectedPost.titleAr : selectedPost.titleFr}
              </h2>

              <div className="flex items-center gap-4 text-xs text-slate-500 border-b border-slate-100 pb-4 font-medium">
                <span>كاتب المقال: {selectedPost.author}</span>
                <span>•</span>
                <span>تاريخ النشر: {selectedPost.publishDate}</span>
              </div>

              <div className="prose max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedPost.contentAr}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-6 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs rounded-md shadow-sm"
                >
                  إغلاق المقال
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
