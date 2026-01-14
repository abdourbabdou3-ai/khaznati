import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY || 'default-dev-key-32-chars-long!!'
    // Ensure key is exactly 32 bytes
    return crypto.createHash('sha256').update(key).digest()
}

export function encrypt(text: string): string {
    if (!text) return ''

    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
    // Handle empty or undefined input
    if (!encryptedText || encryptedText.trim() === '') {
        return ''
    }

    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
        // Return empty string for invalid format instead of throwing
        console.warn('Invalid encrypted text format, returning empty string')
        return ''
    }

    try {
        const iv = Buffer.from(parts[0], 'hex')
        const authTag = Buffer.from(parts[1], 'hex')
        const encrypted = parts[2]

        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (error) {
        console.error('Decryption failed:', error)
        return ''
    }
}

