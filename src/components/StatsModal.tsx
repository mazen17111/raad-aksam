import React, { useEffect, useState } from 'react';
import { X, Award, PlayCircle, CheckCircle, BarChart3, TrendingUp, Calendar, Clock } from 'lucide-react';
import { StudentUser, ExamAttempt } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: StudentUser;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    const fetchAttempts = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'exam_attempts'),
          where('userId', '==', currentUser.id)
        );
        const snap = await getDocs(q);
        const list: ExamAttempt[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as ExamAttempt);
        });
        // Sort by createdAt descending
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAttempts(list);
      } catch (err) {
        console.error('Error fetching attempts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const watchedCount = currentUser.watchedVideoIds?.length || 0;
  const examsCount = currentUser.totalExamsTaken || attempts.length;
  const avgScore = currentUser.averageScore ?? (
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length)
      : 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">احصائياتي</h2>
              <p className="text-xs text-slate-400">سجل إنجازاتك ومستوى أدائك في منصة أقسام رعد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {/* 1. Watched Videos */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 relative overflow-hidden group">
            <div className="flex items-center justify-between text-blue-400 mb-2">
              <span className="text-xs font-bold">الفيديوهات التي شاهدتها</span>
              <PlayCircle className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-white">{watchedCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">محاضرات وشروحات مكتملة</p>
          </div>

          {/* 2. Solved Exams */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 relative overflow-hidden group">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-bold">الاختبارات التي قمت بحلها</span>
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-white">{examsCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">اختبارات محاكية ومجلدات</p>
          </div>

          {/* 3. Average Score */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 relative overflow-hidden group">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-bold">متوسط جميع اختباراتك</span>
              <Award className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-amber-400">%{avgScore}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {avgScore >= 85 ? 'ممتاز! في طريقك للـ 100%' : avgScore >= 65 ? 'جيد جداً، واصل التدريب' : 'تحتاج لمزيد من التركيز'}
            </p>
          </div>
        </div>

        {/* Recent Exams Log */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>سجل آخر الاختبارات</span>
          </h3>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">جاري تحميل سجل الاختبارات...</div>
          ) : attempts.length === 0 ? (
            <div className="py-8 text-center bg-slate-800/30 rounded-2xl border border-slate-800 text-sm text-slate-500">
              لم تقم بحل أي اختبارات بعد. ابدأ أول اختبار الآن لتحصل على إحصائياتك!
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {attempts.map((att) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between text-xs md:text-sm"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white">{att.examTitle}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(att.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                      <span>•</span>
                      <span>{att.score} من {att.totalQuestions} صحيحة</span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                    att.percentage >= 85
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : att.percentage >= 60
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    %{att.percentage}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
