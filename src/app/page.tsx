'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'حدث خطأ ما')
            }

            router.push('/dashboard')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ ما')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main>
            <div className="container">
                {/* Navbar */}
                <nav className="navbar">
                    <div className="logo">🔐 خزنتي</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                        if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
                            alert('اضغط على "إضافة إلى الشاشة الرئيسية" من قائمة المتصفح')
                        } else {
                            alert('افتح الموقع من متصفح الهاتف واختر "إضافة إلى الشاشة الرئيسية"')
                        }
                    }}>
                        📱 تحميل التطبيق
                    </button>
                </nav>

                {/* Hero Section */}
                <section className="hero">
                    <h1 className="hero-title">
                        احتفظ بمعلومات حساباتك بأمان،<br />
                        ولن تنساها مرة أخرى
                    </h1>
                    <p className="hero-subtitle">
                        منصة عربية آمنة لحفظ معلومات الدخول لتطبيقاتك ومواقعك المفضلة.
                        بسيطة، سريعة، ومشفرة بالكامل.
                    </p>
                </section>

                {/* Features */}
                <div className="features">
                    <div className="card feature-card slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="feature-icon">🔒</div>
                        <h3 className="feature-title">تشفير عالي المستوى</h3>
                        <p className="feature-desc">
                            جميع كلمات المرور مشفرة بتقنية AES-256 الآمنة
                        </p>
                    </div>

                    <div className="card feature-card slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="feature-icon">📱</div>
                        <h3 className="feature-title">وصول من أي جهاز</h3>
                        <p className="feature-desc">
                            استخدمه كموقع أو تطبيق، بياناتك متزامنة دائماً
                        </p>
                    </div>

                    <div className="card feature-card slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="feature-icon">📂</div>
                        <h3 className="feature-title">تنظيم سهل</h3>
                        <p className="feature-desc">
                            احفظ ملفات ومستندات مهمة مع حساباتك
                        </p>
                    </div>
                </div>

                {/* Auth Section */}
                <section className="auth-section">
                    <div className="card auth-card slide-up" style={{ animationDelay: '0.4s' }}>
                        <div className="auth-tabs">
                            <button
                                className={`auth-tab ${isLogin ? 'active' : ''}`}
                                onClick={() => { setIsLogin(true); setError('') }}
                            >
                                تسجيل الدخول
                            </button>
                            <button
                                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                                onClick={() => { setIsLogin(false); setError('') }}
                            >
                                إنشاء حساب
                            </button>
                        </div>

                        {error && (
                            <div className="alert alert-error">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="example@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    dir="ltr"
                                    style={{ textAlign: 'left' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">كلمة المرور</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    dir="ltr"
                                    style={{ textAlign: 'left' }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '0.5rem' }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="loading-spinner" />
                                ) : isLogin ? (
                                    'تسجيل الدخول'
                                ) : (
                                    'إنشاء حساب جديد'
                                )}
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </main>
    )
}
