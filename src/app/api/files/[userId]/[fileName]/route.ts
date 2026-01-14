import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { supabase } from '@/lib/supabase'

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
        let fileBuffer: Buffer | Uint8Array

        // Determine content type early
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

        if (existsSync(filePath)) {
            fileBuffer = await readFile(filePath)
        } else if (supabase) {
            // Try Supabase Storage if local file doesn't exist (Vercel)
            const { data, error } = await supabase.storage
                .from('attachments')
                .download(`${userId}/${fileName}`)

            if (error || !data) {
                console.error('Supabase download error:', error)
                return NextResponse.json(
                    { error: 'الملف غير موجود' },
                    { status: 404 }
                )
            }
            fileBuffer = Buffer.from(await data.arrayBuffer())
        } else {
            return NextResponse.json(
                { error: 'الملف غير موجود' },
                { status: 404 }
            )
        }

        return new NextResponse(new Uint8Array(fileBuffer), {
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

