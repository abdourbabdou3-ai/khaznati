import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'غير مصرح' },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json(
                { error: 'الملف مطلوب' },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/gif',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'نوع الملف غير مدعوم' },
                { status: 400 }
            )
        }

        // Validate file size (max 5MB for Supabase free tier safety)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'حجم الملف يتجاوز الحد المسموح (5 ميجابايت)' },
                { status: 400 }
            )
        }

        const timestamp = Date.now()
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}-${sanitizedName}`
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Try Supabase Storage first (for production)
        if (supabase) {
            const { data, error } = await supabase.storage
                .from('attachments')
                .upload(`${user.userId}/${fileName}`, buffer, {
                    contentType: file.type,
                    upsert: false
                })

            if (!error) {
                const relativePath = `/api/files/${user.userId}/${fileName}`
                return NextResponse.json({
                    success: true,
                    filePath: relativePath,
                    fileName: file.name,
                })
            }
            console.error('Supabase upload error:', error)
            // If Supabase fails but we are on Vercel, we can't fallback to local fs
            if (process.env.VERCEL) {
                return NextResponse.json(
                    { error: 'خطأ في حفظ الملف سحابياً. تأكد من إعدادات Supabase Storage' },
                    { status: 500 }
                )
            }
        }

        // Fallback to Local Storage (for local dev)
        const uploadsDir = join(process.cwd(), 'uploads', user.userId.toString())
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true })
        }

        const filePath = join(uploadsDir, fileName)
        await writeFile(filePath, buffer)

        const relativePath = `/api/files/${user.userId}/${fileName}`

        return NextResponse.json({
            success: true,
            filePath: relativePath,
            fileName: file.name,
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ أثناء رفع الملف' },
            { status: 500 }
        )
    }
}

