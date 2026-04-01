import { KeyPair, EncryptedMessage, ICryptoService } from './types'

export class WebCryptoService implements ICryptoService {
  private crypto: Crypto
  
  constructor() {
    this.crypto = window.crypto
  }
  
  async generateKeyPair(): Promise<KeyPair> {
    // Временное решение - возвращаем фейковые ключи
    const fakeKey = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      fakeKey[i] = Math.floor(Math.random() * 256)
    }
    
    return {
      publicKey: fakeKey,
      privateKey: fakeKey
    }
  }
  
  async encryptForRecipient(
    message: string,
    recipientPublicKey: Uint8Array,
    senderPrivateKey: Uint8Array
  ): Promise<EncryptedMessage> {
    // Временное решение - возвращаем исходное сообщение
    return {
      ciphertext: btoa(unescape(encodeURIComponent(message))),
      nonce: 'dummy_nonce',
      senderPublicKey: btoa(unescape(encodeURIComponent('dummy_key')))
    }
  }
  
  async decryptMessage(
    encrypted: EncryptedMessage,
    recipientPrivateKey: Uint8Array,
    senderPublicKey: Uint8Array
  ): Promise<string> {
    // Временное решение - возвращаем декодированное сообщение
    try {
      return decodeURIComponent(escape(atob(encrypted.ciphertext)))
    } catch {
      return encrypted.ciphertext
    }
  }
  
  async getKeyFingerprint(publicKey: Uint8Array): Promise<string> {
    // Временное решение
    return Array.from(publicKey.slice(0, 8))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}
