'use client'

import Link from 'next/link'
import { FiArrowLeft, FiShield, FiMail, FiLock, FiDatabase, FiUsers } from 'react-icons/fi'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <FiArrowLeft size={20} />
          <span>Назад</span>
        </Link>
        
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <FiShield className="text-[#2b6bff]" size={32} />
            <h1 className="text-3xl font-bold gradient-text">Политика конфиденциальности</h1>
          </div>
          <p className="text-gray-400 mb-6">Последнее обновление: 2 апреля 2026 г.</p>
          
          <div className="space-y-8 text-gray-300">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FiDatabase className="text-[#2b6bff]" size={20} />
                <h2 className="text-xl font-semibold text-white">1. Какие данные мы собираем</h2>
              </div>
              <p>Для работы WaxGram мы собираем только необходимую информацию:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Email адрес — для авторизации и восстановления доступа</li>
                <li>Имя пользователя (username) — для идентификации в мессенджере</li>
                <li>Фото профиля — по желанию пользователя</li>
                <li>Дата рождения — для возрастных ограничений</li>
                <li>Текст сообщений — хранится в зашифрованном виде</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <FiLock className="text-[#2b6bff]" size={20} />
                <h2 className="text-xl font-semibold text-white">2. Как мы используем ваши данные</h2>
              </div>
              <p>Ваши данные используются исключительно для:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Обеспечения работы мессенджера</li>
                <li>Отправки уведомлений о новых сообщениях</li>
                <li>Верификации аккаунта (галочки)</li>
                <li>Улучшения качества сервиса</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <FiShield className="text-[#2b6bff]" size={20} />
                <h2 className="text-xl font-semibold text-white">3. Безопасность данных</h2>
              </div>
              <p>Мы используем современные методы защиты:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Сквозное шифрование сообщений (E2EE)</li>
                <li>Хранение паролей в зашифрованном виде</li>
                <li>Защищенные соединения (HTTPS)</li>
                <li>Регулярные аудиты безопасности</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <FiUsers className="text-[#2b6bff]" size={20} />
                <h2 className="text-xl font-semibold text-white">4. Передача данных третьим лицам</h2>
              </div>
              <p>Мы не передаем ваши данные третьим лицам. Ваши сообщения видны только участникам переписки.</p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <FiMail className="text-[#2b6bff]" size={20} />
                <h2 className="text-xl font-semibold text-white">5. Контакты</h2>
              </div>
              <p>По вопросам конфиденциальности вы можете связаться с нами:</p>
              <p className="mt-2">Email: <a href="mailto:privacy@waxgram.com" className="text-[#2b6bff] hover:underline">ismayilasim
              </a></p>
              <p>Telegram: <a href="https://t.me/ismayil066" className="text-[#2b6bff] hover:underline">@ismayil066</a></p>
            </section>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 text-center text-gray-500 text-sm">
            <p>Используя WaxGram, вы соглашаетесь с условиями данной политики конфиденциальности.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
