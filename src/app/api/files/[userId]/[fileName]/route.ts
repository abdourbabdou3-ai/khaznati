import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

interface RouteParams {
    params: Promise<{ userId: string; fileName: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'غير مصرح' },
                { status: 401 }
            )
        }

        const { userId, fileName } = await params

        // Only allow users to access their own files
        if (parseInt(userId) !== user.userId) {
            return NextResponse.json(
                { error: 'غير مصرح' },
                { status: 403 }
            )
        }

        const filePath = join(process.cwd(), 'uploads', userId, fileName)

        if (!existsSync(filePath)) {
            return NextResponse.json(
                { error: 'الملف غير موجود' },
                { status: 404 }
            )
        }

        const fileBuffer = await readFile(filePath)

        // Determine content type
        const ext = fileName.split('.').pop()?.toLowerCase()
        const contentTypes: Record<string, string> = {
            pdf: 'application/pdf',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            txt: 'text/plain',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }

        const contentType = contentTypes[ext || ''] || 'application/octet-stream'

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${fileName}"`,
            },
        })
    } catch (error) {
        console.error('File serve error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ أثناء جلب الملف' },
            { status: 500 }
        )
    }
}
