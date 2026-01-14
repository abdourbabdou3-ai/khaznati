import { NextResponse } from 'next/server'
import { removeAuthCookie } from '@/lib/auth'

export async function POST() {
    try {
        await removeAuthCookie()

        return NextResponse.json({
            success: true,
            message: 'تم تسجيل الخروج بنجاح'
        })
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ أثناء تسجيل الخروج' },
            { status: 500 }
        )
    }
}
