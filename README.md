# React + Vite

Este template fornece uma configuracao minima para usar React com Vite, com HMR e algumas regras de ESLint.

Atualmente, existem dois plugins oficiais disponiveis:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react), que usa [Babel](https://babeljs.io/) (ou [oxc](https://oxc.rs), quando usado com [rolldown-vite](https://vite.dev/guide/rolldown)) para Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc), que usa [SWC](https://swc.rs/) para Fast Refresh

## Compilador do React

No momento, o Compilador do React nao e compativel com SWC. Veja [esta issue](https://github.com/vitejs/vite-plugin-react/issues/428) para acompanhar o progresso.

## Expansao da configuracao do ESLint

Se voce estiver desenvolvendo uma aplicacao de producao, a recomendacao e usar TypeScript com regras de lint orientadas por tipos. Consulte o [template TS](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) para saber como integrar TypeScript e [`typescript-eslint`](https://typescript-eslint.io) no projeto.

## Comandos das extensoes instaladas

### Back-end (`/backend`)

```bash
npm install cors dotenv express
npm install -D nodemon
```

### Front-end (`/frontend`)

```bash
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip class-variance-authority clsx cmdk embla-carousel-react input-otp lucide-react next-themes react react-day-picker react-dom react-hook-form react-resizable-panels react-router-dom recharts sonner tailwind-merge tw-animate-css vaul
npm install -D @eslint/js @tailwindcss/vite @types/react @types/react-dom @vitejs/plugin-react-swc eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals tailwindcss vite
```

## Comandos para executar o projeto

### Back-end (`/backend`)

```bash
cd backend
npm install
npm run dev
```

### Front-end (`/frontend`)

```bash
cd frontend
npm install
npm run dev
```

### Outros comandos uteis do front-end

```bash
npm run build
npm run lint
npm run preview
```
