import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
    title: 'خزنتي - الخزنة الرقمية الآمنة لحساباتك',
    description: 'خزنتي هي منصة عربية محترفة لتشزين وإدارة كلمات المرور الخاصة بك بأمان تام وتشفير عالي المستوى. لا تقلق بشأن نسيان بياناتك مرة أخرى.',
    applicationName: 'khaznati',
    manifest: '/manifest.json',
    themeColor: '#1e40af',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
    icons: {
        icon: '/icons/icon-192.png',
        apple: '/icons/icon-192.png',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ar" dir="rtl">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>
                {children}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
                    }}
                />
            </body>
        </html>
    )
}
