'use client'

import Link from 'next/link'
import { FiArrowLeft, FiFileText, FiAlertCircle, FiUserCheck, FiShield, FiGlobe } from 'react-icons/fi'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <FiArrowLeft size={20} />
          <span>Назад</span>
        </Link>
        
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <FiFileText className="text-[#2b6bff]" size={32} />
            <h1 className="text-3xl font-bold gradient-text">Условия использования</h1>
          </div>
          <p className="text-gray-400 mb-6">Последнее обновление: 2 апреля 2026 г.</p>
          
          <div className="space-y-8 text-gray-300">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FiUserCheck className="text-[#2b6bff]" size={20} />
                <h2 className="text-xl font-semibold text-white">1. Регистрация и аккаунт</h2>
              </div>
              <p>Для использования WaxGram необходимо:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Быть старше 13 лет</li>
                <li>Предоставить действующий email</li>
                <li>Выбрать уникальное имя пользователя</li>
                <li>Не нарушать правила сообщества</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <FiAlertCircle className="text-[#2b6bff]" size={20} />
                <h2 className="text-xl font-semibold text-white">2. Запрещенный контент</h2>
              </div>
              <p>Запрещается публикация и распространение:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Незаконного контента</li>
                <li>Спама и рекламы без согласия</li>
                <li>Оскорбительных материалов</li>
                <li>Нарушающих авторские прав</li>
                <li>Личной информации без согласия</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <FiShield className="text-[#2b6bff]" size={20} />
                <h2 className="text-xl font-semibold text-white">3. Ответственность пользователя</h2>
              </div>
              <p>Вы несете ответственность за:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Безопасность вашего аккаунта</li>
                <li>Все действия, совершенные под вашим аккаунтом</li>
                <li>Содержание отправляемых сообщений</li>
                <li>Соблюдение законодательства</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <FiGlobe className="text-[#2b6bff]" size={20} />
                <h2 className="text-xl font-semibold text-white">4. Ограничения сервиса</h2>
              </div>
              <p>Мы оставляем за собой право:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Ограничивать доступ при нарушении правил</li>
                <li>Удалять запрещенный контент</li>
                <li>Блокировать аккаунты нарушителей</li>
                <li>Вносить изменения в сервис</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <FiFileText className="text-[#2b6bff]" size={20} />
                <h2 className="text-xl font-semibold text-white">5. Изменение условий</h2>
              </div>
              <p>Мы можем обновлять условия использования. О существенных изменениях мы уведомим пользователей через email или уведомления в приложении.</p>
            </section>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 text-center text-gray-500 text-sm">
            <p>Используя WaxGram, вы соглашаетесь с условиями использования.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
