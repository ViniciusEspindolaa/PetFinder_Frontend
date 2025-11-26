# 🐾 PetFinder Frontend

Interface moderna e responsiva para a plataforma PetFinder, desenvolvida com **Next.js 14** e **Tailwind CSS**.

## ✨ **STATUS: MVP COMPLETO (TCC)** ✨

## 🚀 Funcionalidades

- **🔐 Autenticação Completa**:
  - Login e Cadastro
  - **Login Social com Google**
  - **Recuperação de Senha** (Fluxo completo)
- **🗺️ Mapa Interativo**:
  - Visualização de pets perdidos/encontrados no mapa (Leaflet/OpenStreetMap)
  - Filtragem por raio de distância
- **📱 Responsividade**: Design mobile-first adaptado para qualquer dispositivo
- **👤 Perfil de Usuário**:
  - Edição de dados pessoais
  - **Configuração de Raio de Alerta** (Slider interativo)
  - Histórico de pets reportados
- **📢 Reportar Pet**:
  - Fluxo guiado para cadastro de pets
  - Upload de fotos (integrado ao Cloudinary via Backend)
  - **Seletor de Localização Precisa**: Mapa interativo para marcar o local exato do avistamento ou perda
- **🔔 Notificações**: Interface para visualizar alertas de pets próximos
- **♿ Acessibilidade**:
  - **Modo Alto Contraste**: Opção para melhorar a legibilidade para usuários com baixa visão
- **📍 Geolocalização Avançada**:
  - **Rastreamento em Segundo Plano**: Atualização automática da localização do usuário para alertas de proximidade (Geofencing)
  - **Geocodificação Reversa**: Preenchimento automático de endereço ao clicar no mapa
- **🔍 Busca e Filtros**:
  - Ordenação por data, proximidade e recompensa
  - Filtros por espécie, status e localização

## 🛠️ Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** - Estilização
- **Shadcn/UI** - Componentes de interface acessíveis
- **Radix UI** - Primitivos de UI
- **Lucide React** - Ícones
- **Leaflet & React-Leaflet** - Mapas Interativos (OpenStreetMap)
- **Nominatim API** - Geocodificação Reversa (OpenStreetMap)
- **Google Identity Services** - Login Google
- **Zod** - Validação de formulários
- **React Hook Form** - Gerenciamento de formulários

## 📦 Instalação

### Pré-requisitos
- Node.js >= 18
- Backend do PetFinder rodando (porta 3001)

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/petfinder-frontend.git
cd Frontend
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
# URL da API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Google OAuth (Necessário para login com Google)
NEXT_PUBLIC_GOOGLE_CLIENT_ID="sua_client_id_google"
```

### 4. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🏗️ Estrutura do Projeto

- `app/` - Páginas e rotas (App Router)
  - `(auth)/` - Rotas de autenticação (login, signup, forgot-password)
  - `profile/` - Área do usuário
  - `new-pet/` - Fluxo de cadastro de pet
  - `map/` - Visualização do mapa
- `components/` - Componentes React reutilizáveis
  - `ui/` - Componentes base (Shadcn)
- `lib/` - Utilitários e Contextos
  - `auth-context.tsx` - Gerenciamento de estado de autenticação
  - `api.ts` - Cliente HTTP configurado
- `hooks/` - Custom Hooks (ex: use-toast)

## 🤝 Integração com Backend

Este frontend consome a API REST do PetFinder Backend. Certifique-se de que o backend esteja rodando para que funcionalidades como login, cadastro e listagem de pets funcionem corretamente.

## 📱 Telas Principais

1. **Home**: Landing page com busca rápida e destaques.
2. **Mapa**: Visualização geoespacial dos pets.
3. **Login/Cadastro**: Acesso seguro.
4. **Perfil**: Gerenciamento de conta e preferências.
5. **Novo Pet**: Formulário wizard para reportar ocorrências.

---

Desenvolvido como parte da disciplina de Projeto de Desenvolvimento I, da UniSenac Pelotas.
