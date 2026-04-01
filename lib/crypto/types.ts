export interface KeyPair {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

export interface EncryptedMessage {
  ciphertext: string
  nonce: string
  senderPublicKey: string
}

export interface ICryptoService {
  generateKeyPair(): Promise<KeyPair>
  encryptForRecipient(
    message: string,
    recipientPublicKey: Uint8Array,
    senderPrivateKey: Uint8Array
  ): Promise<EncryptedMessage>
  decryptMessage(
    encrypted: EncryptedMessage,
    recipientPrivateKey: Uint8Array,
    senderPublicKey: Uint8Array
  ): Promise<string>
  getKeyFingerprint(publicKey: Uint8Array): Promise<string>
}
