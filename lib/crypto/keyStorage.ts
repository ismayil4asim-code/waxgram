import { KeyPair } from './types'

export class KeyStorage {
  async saveKeyPair(keyPair: KeyPair): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem('public_key', this.arrayBufferToBase64(keyPair.publicKey))
      localStorage.setItem('private_key', this.arrayBufferToBase64(keyPair.privateKey))
    }
  }
  
  async getPrivateKey(): Promise<Uint8Array | null> {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('private_key')
      if (stored) {
        return this.base64ToArrayBuffer(stored)
      }
    }
    return null
  }
  
  async getPublicKey(): Promise<Uint8Array | null> {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('public_key')
      if (stored) {
        return this.base64ToArrayBuffer(stored)
      }
    }
    return null
  }
  
  private arrayBufferToBase64(bytes: Uint8Array): string {
    let binary = ''
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
  
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
}
