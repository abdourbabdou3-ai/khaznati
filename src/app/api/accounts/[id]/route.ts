import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'

interface RouteParams {
    params: Promise<{ id: string }>
}

// PUT - Update account
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
        const existingAccount = await prisma.account.findFirst({
            where: { id: accountId, userId: user.userId }
        })

        if (!existingAccount) {
            return NextResponse.json(
                { error: 'الحساب غير موجود' },
                { status: 404 }
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
        const passwordEncrypted = password ? encrypt(password) : existingAccount.passwordEncrypted

        const account = await prisma.account.update({
            where: { id: accountId },
            data: {
                appName,
                username: username || null,
                passwordEncrypted,
                websiteUrl: websiteUrl || null,
                notes: notes || null,
                filePath: filePath || existingAccount.filePath,
            }
        })

        return NextResponse.json({
            success: true,
            account,
        })
    } catch (error) {
        console.error('Update account error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ أثناء تحديث الحساب' },
            { status: 500 }
        )
    }
}

// DELETE - Delete account
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
        const existingAccount = await prisma.account.findFirst({
            where: { id: accountId, userId: user.userId }
        })

        if (!existingAccount) {
            return NextResponse.json(
                { error: 'الحساب غير موجود' },
                { status: 404 }
            )
        }

        await prisma.account.delete({
            where: { id: accountId }
        })

        return NextResponse.json({
            success: true,
            message: 'تم حذف الحساب بنجاح'
        })
    } catch (error) {
        console.error('Delete account error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ أثناء حذف الحساب' },
            { status: 500 }
        )
    }
}
