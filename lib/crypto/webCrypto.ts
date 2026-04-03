import { KeyPair, EncryptedMessage, ICryptoService } from './types'

export class WebCryptoService implements ICryptoService {
  async generateKeyPair(): Promise<KeyPair> {
    if (typeof window === 'undefined') throw new Error('WebCrypto not available')
    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey']
    )
    const publicKeyBuffer = await window.crypto.subtle.exportKey('raw', keyPair.publicKey)
    const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    return {
      publicKey: new Uint8Array(publicKeyBuffer),
      privateKey: new Uint8Array(privateKeyBuffer),
    }
  }

  async encryptForRecipient(
    message: string,
    _recipientPublicKey: Uint8Array,
    _senderPrivateKey: Uint8Array
  ): Promise<EncryptedMessage> {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const key = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
    const nonce = window.crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, data)
    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      nonce: btoa(String.fromCharCode(...nonce)),
      senderPublicKey: 'placeholder',
    }
  }

  async decryptMessage(
    encrypted: EncryptedMessage,
    _recipientPrivateKey: Uint8Array,
    _senderPublicKey: Uint8Array
  ): Promise<string> {
    try {
      return decodeURIComponent(escape(atob(encrypted.ciphertext)))
    } catch {
      return encrypted.ciphertext
    }
  }

  async getKeyFingerprint(publicKey: Uint8Array): Promise<string> {
    if (typeof window === 'undefined') return ''
    // Копируем в новый ArrayBuffer чтобы избежать SharedArrayBuffer
    const buffer = new Uint8Array(publicKey).buffer
    const hash = await window.crypto.subtle.digest('SHA-256', buffer)
    return Array.from(new Uint8Array(hash).slice(0, 8))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(':')
  }
}
