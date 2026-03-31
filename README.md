# Frontend - Zentry (React + Vite)

## 1. O que precisa baixar

1. Node.js 20+ (recomendado LTS)
2. npm 10+ (vem com Node)
3. Git
4. VS Code (opcional, mas recomendado)

## 2. Extensoes recomendadas (VS Code)

1. `ESLint` (dbaeumer.vscode-eslint)
2. `Prettier - Code formatter` (esbenp.prettier-vscode)
3. `Tailwind CSS IntelliSense` (bradlc.vscode-tailwindcss)
4. `EditorConfig for VS Code` (EditorConfig.EditorConfig)
5. `Path Intellisense` (christian-kohler.path-intellisense)
6. `Error Lens` (usernamehw.errorlens)

## 3. Instalar dependencias

```bash
cd frontend
npm install
```

## 4. Variaveis de ambiente

Este frontend funciona sem `.env` por padrao.

Opcionalmente, voce pode criar `frontend/.env` para configurar URL base da API:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Se nao definir, as chamadas usam `/api` e o proxy do Vite.

## 5. Rodar em desenvolvimento

```bash
npm run dev
```

O app abre em `http://localhost:5173` (porta padrao do Vite).

## 6. Scripts uteis

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run test:watch
npm run test:coverage
```

Observacao: a base inicial de testes ja existe e os arquivos ficam em `frontend/test`.

## 7. Integracao com backend

O arquivo `vite.config.js` ja faz proxy de `/api` para:

```txt
http://localhost:3000
```

Entao, para o frontend funcionar completo, o backend precisa estar rodando junto.
