import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { decrypt } from '@/lib/encryption'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET - Decrypt password for an account
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'غير مصرح' },
                { status: 401 }
            )
        }

        const { id } = await params
        const accountId = parseInt(id)

        // Check if account belongs to user
        const account = await prisma.account.findFirst({
            where: { id: accountId, userId: user.userId },
            select: { passwordEncrypted: true }
        })

        if (!account) {
            return NextResponse.json(
                { error: 'الحساب غير موجود' },
                { status: 404 }
            )
        }

        // Decrypt password
        let password = ''
        if (account.passwordEncrypted) {
            try {
                password = decrypt(account.passwordEncrypted)
            } catch {
                password = ''
            }
        }

        return NextResponse.json({ password })
    } catch (error) {
        console.error('Decrypt password error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ أثناء فك تشفير كلمة المرور' },
            { status: 500 }
        )
    }
}
