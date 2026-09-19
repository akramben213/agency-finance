'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AgencyFinanceDashboard() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // البيانات
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, net_balance: 0, total_transactions: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [monthlyFinance, setMonthlyFinance] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // نموذج المعاملة
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Espèce');
  const [clientVendor, setClientVendor] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      checkRoleAndFetchData(session.user);
    } else {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError('خطأ في بيانات الدخول، يرجى التأكد وإعادة المحاولة.');
      setLoading(false);
    } else if (data.user) {
      setUser(data.user);
      checkRoleAndFetchData(data.user);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }

  async function checkRoleAndFetchData(currentUser: any) {
    setLoading(true);
    const isUserAdmin = 
      currentUser?.email === 'akramben213@gmail.com' || 
      currentUser?.email === 'akram@asean.com' || 
      currentUser?.app_metadata?.role === 'admin' ||
      currentUser?.user_metadata?.role === 'admin';

    setIsAdmin(isUserAdmin);

    await Promise.all([
      fetchSummary(),
      fetchTransactions(),
      fetchMonthlyFinance(),
      fetchCategories()
    ]);

    setLoading(false);
  }

  async function fetchSummary() {
    const { data } = await supabase.from('finance_summary').select('*').single();
    if (data) setSummary(data);
  }

  async function fetchTransactions() {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (data) setTransactions(data);
  }

  async function fetchMonthlyFinance() {
    const { data } = await supabase.from('monthly_finance').select('*').order('month', { ascending: false });
    if (data) setMonthlyFinance(data);
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return alert('يرجى إدخال مبلغ صحيح');

    setSubmitting(true);
    const newTx = {
      type,
      amount: parseFloat(amount),
      category: category || (categories[0]?.name || 'عام'),
      payment_method: paymentMethod,
      client_vendor: clientVendor,
      description,
      date: new Date().toISOString()
    };

    const { error } = await supabase.from('transactions').insert([newTx]);

    if (error) {
      alert('حدث خطأ أثناء الإضافة: ' + error.message);
    } else {
      setAmount('');
      setDescription('');
      setClientVendor('');
      fetchSummary();
      fetchTransactions();
      fetchMonthlyFinance();
    }
    setSubmitting(false);
  }

  async function handleDeleteTransaction(id: string) {
    if (!confirm('هل أنت تأكد من حذف هذه المعاملة؟')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      fetchSummary();
      fetchTransactions();
      fetchMonthlyFinance();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // ------------------- شاشة تسجيل الدخول -------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans" dir="rtl">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl mb-4 text-2xl font-bold">
              💰
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">إدارة مالية الوكالة</h1>
            <p className="text-slate-400 text-sm mt-1">سجل دخولك للوصول للوحة التحكم</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl text-center font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">كلمة المرور</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm active:scale-[0.98]"
            >
              دخول الحساب
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ------------------- لوحة التحكم الرئيسية -------------------
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans antialiased p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* الهيدر الرئيسي */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center text-xl shadow-md">
              💼
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">نظام الإدارة المالية للوكالة</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                المستخدم: <span className="text-slate-200 font-medium">{user.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              isAdmin 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {isAdmin ? '🛡️ مسؤول (Admin)' : '👁️ مشاهد (Viewer)'}
            </span>

            <button
              onClick={handleLogout}
              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-medium px-4 py-2 rounded-xl transition-all"
            >
              تسجيل الخروج
            </button>
          </div>
        </header>

        {/* تنبيه الصلاحية للمشاهد */}
        {!isAdmin && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-5 py-4 rounded-2xl text-sm flex items-center gap-3">
            <span>ℹ️</span>
            <span>أنت متصل بحساب <b>مشاهد (Viewer)</b>. يمكنك معاينة المداخيل والمصاريف دون القدرة على الإضافة أو التعديل.</span>
          </div>
        )}

        {/* بطاقات الملخص المالي (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-lg">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">مجموع المداخيل</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2">
              {summary.total_income?.toLocaleString()} <span className="text-xs font-normal text-emerald-500">د.ج</span>
            </div>
            <div className="absolute top-4 left-4 w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">📈</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-lg">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">مجموع المصاريف</div>
            <div className="text-2xl font-extrabold text-rose-400 mt-2">
              {summary.total_expenses?.toLocaleString()} <span className="text-xs font-normal text-rose-500">د.ج</span>
            </div>
            <div className="absolute top-4 left-4 w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400">📉</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-lg">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">الرصيد الصافي</div>
            <div className={`text-2xl font-extrabold mt-2 ${summary.net_balance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              {summary.net_balance?.toLocaleString()} <span className="text-xs font-normal text-slate-400">د.ج</span>
            </div>
            <div className="absolute top-4 left-4 w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">💳</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-lg">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">إجمالي المعاملات</div>
            <div className="text-2xl font-extrabold text-white mt-2">
              {summary.total_transactions} <span className="text-xs font-normal text-slate-500">معاملة</span>
            </div>
            <div className="absolute top-4 left-4 w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400">🧾</div>
          </div>
        </div>

        {/* نموذج إضافة معاملة جديدة (للمسؤول فقط) */}
        {isAdmin && (
          <div className="bg-slate-900/80 border border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span>✨</span> إضافة معاملة جديدة
            </h2>

            <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">نوع المعاملة</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="income">مدخول (+)</option>
                  <option value="expense">مصروف (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">المبلغ (د.ج)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">التصنيف</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">اختر التصنيف...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">طريقة الدفع</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Espèce">نقداً (Espèce)</option>
                  <option value="CCP">حساب CCP</option>
                  <option value="BaridiMob">BaridiMob</option>
                  <option value="Virement">تحويل بنكي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">اسم الزبون / المورد</label>
                <input
                  type="text"
                  placeholder="مثال: شركة A"
                  value={clientVendor}
                  onChange={(e) => setClientVendor(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">الوصف / التفاصيل</label>
                <input
                  type="text"
                  placeholder="وصف مختصر للمعاملة"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-3 flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ المعاملة'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* جدول المعاملات الأخيرة */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6">سجل المعاملات الأخيرة</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-4">التاريخ</th>
                  <th className="py-4 px-4">النوع</th>
                  <th className="py-4 px-4">التصنيف</th>
                  <th className="py-4 px-4">الوصف</th>
                  <th className="py-4 px-4">الزبون/المورد</th>
                  <th className="py-4 px-4">طريقة الدفع</th>
                  <th className="py-4 px-4">المبلغ</th>
                  {isAdmin && <th className="py-4 px-4 text-center">إجراءات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-slate-500">
                      لا توجد معاملات مسجلة بعد.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('ar-DZ')}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          tx.type === 'income' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {tx.type === 'income' ? 'مدخول' : 'مصروف'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-300 whitespace-nowrap">{tx.category || '-'}</td>
                      <td className="py-4 px-4 text-slate-400 max-w-xs truncate">{tx.description || '-'}</td>
                      <td className="py-4 px-4 text-slate-300 whitespace-nowrap">{tx.client_vendor || '-'}</td>
                      <td className="py-4 px-4 text-slate-400 whitespace-nowrap">{tx.payment_method}</td>
                      <td className={`py-4 px-4 font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount?.toLocaleString()} د.ج
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2 rounded-lg transition-all"
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* الملخص الشهري */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6">الملخص الشهري</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-4">الشهر</th>
                  <th className="py-4 px-4">المداخيل</th>
                  <th className="py-4 px-4">المصاريف</th>
                  <th className="py-4 px-4">الصافي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {monthlyFinance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-500">لا توجد بيانات شهرية متاحة.</td>
                  </tr>
                ) : (
                  monthlyFinance.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 font-medium text-white">{m.month}</td>
                      <td className="py-4 px-4 text-emerald-400 font-semibold">{m.total_income?.toLocaleString()} د.ج</td>
                      <td className="py-4 px-4 text-rose-400 font-semibold">{m.total_expenses?.toLocaleString()} د.ج</td>
                      <td className={`py-4 px-4 font-bold ${m.net_balance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                        {m.net_balance?.toLocaleString()} د.ج
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}