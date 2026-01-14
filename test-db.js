const { PrismaClient } = require('@prisma/client')

async function main() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: 'postgresql://postgres.fxokayjrgniyshenavwg:abdou20102007%23sa@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
            }
        }
    })

    try {
        console.log('Testing connection...')
        const result = await prisma.$queryRaw`SELECT 1`
        console.log('Connection successful:', result)

        const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
        console.log('Tables in database:', tables)
    } catch (error) {
        console.error('Connection failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
