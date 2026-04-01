'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiUserPlus, FiMoreVertical, FiPhone, FiMessageCircle } from 'react-icons/fi'

interface Contact {
  id: string
  name: string
  phone: string
  avatar: string | null
  online: boolean
  lastSeen?: string
}

export function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)

  useEffect(() => {
    // Demo contacts
    setContacts([
      {
        id: '1',
        name: 'Alex Johnson',
        phone: '+7 927 101-03-60',
        avatar: null,
        online: true,
        lastSeen: 'online'
      },
      {
        id: '2',
        name: 'Maria Garcia',
        phone: '+7 926 555-12-34',
        avatar: null,
        online: false,
        lastSeen: 'last seen 5 min ago'
      },
      {
        id: '3',
        name: 'Sarah Wilson',
        phone: '+7 925 777-88-99',
        avatar: null,
        online: true
      },
      {
        id: '4',
        name: 'Tech Support',
        phone: '+7 800 123-45-67',
        avatar: null,
        online: false,
        lastSeen: 'last seen yesterday'
      }
    ])
  }, [])

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  )

  return (
    <div className="ml-20 h-screen flex flex-col">
      {/* Header */}
      <div className="glass px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold gradient-text">Contacts</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <FiUserPlus size={20} />
          </motion.button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <AnimatePresence>
          {filteredContacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all group">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2b6bff] to-[#0055ff] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {contact.name[0].toUpperCase()}
                    </span>
                  </div>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{contact.name}</h3>
                    <span className="text-xs text-gray-400">
                      {contact.online ? '● Online' : contact.lastSeen}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{contact.phone}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-[#2b6bff]/20 rounded-full transition-colors">
                    <FiMessageCircle className="text-[#2b6bff]" size={18} />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <FiPhone className="text-gray-400" size={18} />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <FiMoreVertical className="text-gray-400" size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}