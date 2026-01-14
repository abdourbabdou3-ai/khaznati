'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Account {
    id: number
    appName: string
    username: string | null
    passwordEncrypted: string
    decryptedPassword?: string
    websiteUrl: string | null
    notes: string | null
    filePath: string | null
}

export default function DashboardPage() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)
    const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set())
    const [copiedId, setCopiedId] = useState<number | null>(null)
    const router = useRouter()

    // Form state
    const [formData, setFormData] = useState({
        appName: '',
        username: '',
        password: '',
        websiteUrl: '',
        notes: '',
    })
    const [file, setFile] = useState<File | null>(null)
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState('')

    useEffect(() => {
        fetchAccounts()
    }, [])

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts')
            if (res.status === 401) {
                router.push('/')
                return
            }
            const data = await res.json()
            setAccounts(data.accounts || [])
        } catch {
            console.error('Failed to fetch accounts')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/')
    }

    const togglePassword = async (accountId: number) => {
        if (visiblePasswords.has(accountId)) {
            setVisiblePasswords(prev => {
                const newSet = new Set(prev)
                newSet.delete(accountId)
                return newSet
            })
        } else {
            // Fetch decrypted password
            try {
                const res = await fetch(`/api/accounts/${accountId}/decrypt`)
                const data = await res.json()
                setAccounts(prev => prev.map(acc =>
                    acc.id === accountId ? { ...acc, decryptedPassword: data.password } : acc
                ))
                setVisiblePasswords(prev => new Set(prev).add(accountId))
            } catch {
                console.error('Failed to decrypt password')
            }
        }
    }

    const copyPassword = async (accountId: number) => {
        const account = accounts.find(a => a.id === accountId)
        let password = account?.decryptedPassword

        if (!password) {
            try {
                const res = await fetch(`/api/accounts/${accountId}/decrypt`)
                const data = await res.json()
                password = data.password
            } catch {
                return
            }
        }

        if (password) {
            await navigator.clipboard.writeText(password)
            setCopiedId(accountId)
            setTimeout(() => setCopiedId(null), 2000)
        }
    }

    const openAddModal = () => {
        setEditingAccount(null)
        setFormData({ appName: '', username: '', password: '', websiteUrl: '', notes: '' })
        setFile(null)
        setFormError('')
        setShowModal(true)
    }

    const openEditModal = async (account: Account) => {
        // Get decrypted password for editing
        try {
            const res = await fetch(`/api/accounts/${account.id}/decrypt`)
            const data = await res.json()

            setEditingAccount(account)
            setFormData({
                appName: account.appName,
                username: account.username || '',
                password: data.password || '',
                websiteUrl: account.websiteUrl || '',
                notes: account.notes || '',
            })
            setFile(null)
            setFormError('')
            setShowModal(true)
        } catch {
            console.error('Failed to load account for editing')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormLoading(true)
        setFormError('')

        try {
            let filePath = editingAccount?.filePath || null

            // Upload file if selected
            if (file) {
                const fileFormData = new FormData()
                fileFormData.append('file', file)

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: fileFormData,
                })

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json()
                    filePath = uploadData.filePath
                }
            }

            const payload = {
                ...formData,
                filePath,
            }

            const url = editingAccount ? `/api/accounts/${editingAccount.id}` : '/api/accounts'
            const method = editingAccount ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'حدث خطأ ما')
            }

            setShowModal(false)
            fetchAccounts()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'حدث خطأ ما')
        } finally {
            setFormLoading(false)
        }
    }

    const handleDelete = async (accountId: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return

        try {
            await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' })
            fetchAccounts()
        } catch {
            console.error('Failed to delete account')
        }
    }

    const getAppInitial = (name: string) => {
        return name.charAt(0).toUpperCase()
    }

    if (loading) {
        return (
            <main>
                <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <div className="loading-spinner" style={{ width: 48, height: 48 }} />
                </div>
            </main>
        )
    }

    return (
        <main>
            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">🔐 حساباتي المحفوظة</h1>
                        <p style={{ color: 'var(--slate-400)', marginTop: '0.25rem' }}>
                            {accounts.length} حساب محفوظ
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            ➕ إضافة حساب
                        </button>
                        <button className="btn btn-ghost" onClick={handleLogout}>
                            خروج
                        </button>
                    </div>
                </div>

                {/* Accounts Grid */}
                {accounts.length === 0 ? (
                    <div className="card empty-state fade-in">
                        <div className="empty-icon">📭</div>
                        <h3 className="empty-title">لا توجد حسابات محفوظة</h3>
                        <p className="empty-desc">ابدأ بإضافة حساباتك للحفاظ عليها بأمان</p>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            ➕ أضف حسابك الأول
                        </button>
                    </div>
                ) : (
                    <div className="accounts-grid">
                        {accounts.map((account, index) => (
                            <div
                                key={account.id}
                                className="card account-card fade-in"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="account-header">
                                    <div className="account-icon">
                                        {getAppInitial(account.appName)}
                                    </div>
                                    <div>
                                        <h3 className="account-name">{account.appName}</h3>
                                        <p className="account-username">{account.username || 'بدون اسم مستخدم'}</p>
                                    </div>
                                </div>

                                <div className="password-field">
                                    <span className="password-value">
                                        {visiblePasswords.has(account.id) && account.decryptedPassword
                                            ? account.decryptedPassword
                                            : '••••••••••'}
                                    </span>
                                    <button
                                        className="btn btn-icon btn-ghost"
                                        onClick={() => togglePassword(account.id)}
                                        title={visiblePasswords.has(account.id) ? 'إخفاء' : 'إظهار'}
                                    >
                                        {visiblePasswords.has(account.id) ? '🙈' : '👁️'}
                                    </button>
                                    <button
                                        className="btn btn-icon btn-ghost"
                                        onClick={() => copyPassword(account.id)}
                                        title="نسخ"
                                    >
                                        {copiedId === account.id ? '✅' : '📋'}
                                    </button>
                                </div>

                                {account.websiteUrl && (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '0.75rem' }}>
                                        🔗 <a href={account.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-400)' }}>
                                            {account.websiteUrl}
                                        </a>
                                    </p>
                                )}

                                {account.notes && (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '0.75rem' }}>
                                        📝 {account.notes}
                                    </p>
                                )}

                                {account.filePath && (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '0.75rem' }}>
                                        📎 <a href={account.filePath} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-400)' }}>
                                            ملف مرفق
                                        </a>
                                    </p>
                                )}

                                <div className="account-actions">
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => openEditModal(account)}
                                    >
                                        ✏️ تعديل
                                    </button>
                                    <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => handleDelete(account.id)}
                                        style={{ color: 'var(--error)' }}
                                    >
                                        🗑️ حذف
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal fade-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingAccount ? '✏️ تعديل الحساب' : '➕ إضافة حساب جديد'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {formError && (
                                    <div className="alert alert-error">
                                        <span>⚠️</span>
                                        <span>{formError}</span>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">اسم التطبيق / الموقع *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="مثال: فيسبوك، Gmail..."
                                        value={formData.appName}
                                        onChange={e => setFormData({ ...formData, appName: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">اسم المستخدم / الإيميل</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="اسم المستخدم أو البريد الإلكتروني"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        dir="ltr"
                                        style={{ textAlign: 'left' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">كلمة المرور</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="كلمة المرور للحساب"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        dir="ltr"
                                        style={{ textAlign: 'left' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">رابط الموقع (اختياري)</label>
                                    <input
                                        type="url"
                                        className="form-input"
                                        placeholder="https://..."
                                        value={formData.websiteUrl}
                                        onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                                        dir="ltr"
                                        style={{ textAlign: 'left' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">ملاحظات (اختياري)</label>
                                    <textarea
                                        className="form-input"
                                        placeholder="أي ملاحظات إضافية..."
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">ملف مرفق (اختياري)</label>
                                    <div className="file-upload" onClick={() => document.getElementById('file-input')?.click()}>
                                        <div className="file-upload-icon">📁</div>
                                        <p className="file-upload-text">
                                            {file ? file.name : 'اضغط لرفع ملف (PDF, صورة, نص)'}
                                        </p>
                                    </div>
                                    <input
                                        id="file-input"
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg,.gif,.txt,.doc,.docx"
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    إلغاء
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading ? <span className="loading-spinner" /> : editingAccount ? 'حفظ التعديلات' : 'إضافة الحساب'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}
