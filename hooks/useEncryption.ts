'use client'

import { useState, useEffect } from 'react'
import { WebCryptoService } from '@/lib/crypto/webCrypto'
import { KeyStorage } from '@/lib/crypto/keyStorage'
import { KeyPair } from '@/lib/crypto/types'

export function useEncryption() {
  const [cryptoService] = useState(() => new WebCryptoService())
  const [keyStorage] = useState(() => new KeyStorage())
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initKeys = async () => {
      let privateKey = await keyStorage.getPrivateKey()
      let publicKey = await keyStorage.getPublicKey()
      
      if (!privateKey || !publicKey) {
        const newKeyPair = await cryptoService.generateKeyPair()
        await keyStorage.saveKeyPair(newKeyPair)
        setKeyPair(newKeyPair)
      } else {
        setKeyPair({ privateKey, publicKey })
      }
      
      setLoading(false)
    }
    
    initKeys()
  }, [cryptoService, keyStorage])

  const encryptMessage = async (message: string, recipientPublicKey: Uint8Array) => {
    if (!keyPair) throw new Error('No keys')
    return cryptoService.encryptForRecipient(message, recipientPublicKey, keyPair.privateKey)
  }

  const decryptMessage = async (
    encrypted: any,
    senderPublicKey: Uint8Array
  ) => {
    if (!keyPair) throw new Error('No keys')
    return cryptoService.decryptMessage(encrypted, keyPair.privateKey, senderPublicKey)
  }

  return {
    loading,
    keyPair,
    encryptMessage,
    decryptMessage,
    getFingerprint: (pubKey: Uint8Array) => cryptoService.getKeyFingerprint(pubKey)
  }
}
