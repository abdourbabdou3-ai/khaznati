import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'

// GET - Fetch all accounts for current user
export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'غير مصرح' },
                { status: 401 }
            )
        }

        const accounts = await prisma.account.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                appName: true,
                username: true,
                passwordEncrypted: true,
                websiteUrl: true,
                notes: true,
                filePath: true,
                createdAt: true,
                updatedAt: true,
            }
        })

        return NextResponse.json({ accounts })
    } catch (error) {
        console.error('Fetch accounts error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ أثناء جلب الحسابات' },
            { status: 500 }
        )
    }
}

// POST - Create new account
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'غير مصرح' },
                { status: 401 }
            )
        }

        const { appName, username, password, websiteUrl, notes, filePath } = await request.json()

        if (!appName) {
            return NextResponse.json(
                { error: 'اسم التطبيق مطلوب' },
                { status: 400 }
            )
        }

        // Encrypt the password if provided
        const passwordEncrypted = password ? encrypt(password) : ''

        const account = await prisma.account.create({
            data: {
                userId: user.userId,
                appName,
                username: username || null,
                passwordEncrypted,
                websiteUrl: websiteUrl || null,
                notes: notes || null,
                filePath: filePath || null,
            }
        })

        return NextResponse.json({
            success: true,
            account,
        })
    } catch (error) {
        console.error('Create account error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ أثناء إنشاء الحساب' },
            { status: 500 }
        )
    }
}
