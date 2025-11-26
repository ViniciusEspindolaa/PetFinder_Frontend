import { Briefcase } from 'lucide-react'
import { MobileNav } from '@/components/mobile-nav'

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 to-orange-50 flex flex-col items-center justify-center p-4 text-center pb-20">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-10 h-10 text-teal-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Serviços</h1>
        <p className="text-gray-600 mb-6">
          Em breve você encontrará aqui serviços de Pet Sitter, Dog Walker, Creches e muito mais para o seu pet!
        </p>
        <div className="inline-block bg-orange-100 text-orange-800 px-4 py-1.5 rounded-full text-sm font-medium">
          Em construção 🚧
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
