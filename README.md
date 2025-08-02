# Idara - Modern Business Dashboard

A modern, responsive business dashboard built with Next.js, TypeScript, and Tailwind CSS.

## Features

- ⚡ Built with Next.js 15 for optimal performance
- 🎨 Styled with Tailwind CSS v4 with custom design system
- 📱 Fully responsive design with mobile-first approach
- 🧪 Testing setup with Jest and Testing Library
- 🔧 ESLint and Prettier for code quality
- 🚀 TypeScript for type safety
- 🎯 App Router for modern routing
- 🌙 Dark mode support

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building

Build for production:
```bash
npm run build
```

Start the production server:
```bash
npm run start
```

### Testing

Run tests:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Code Quality

Lint code:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

Format code:
```bash
npm run format
```

Check code formatting:
```bash
npm run format:check
```

## Project Structure

```
src/
├── app/               # Next.js App Router pages and layouts
│   ├── dashboard/     # Dashboard page
│   ├── globals.css    # Global styles and Tailwind configuration
│   ├── layout.tsx     # Root layout component
│   └── page.tsx       # Home page (redirects to dashboard)
├── components/        # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and configurations
└── types/            # TypeScript type definitions
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **Testing**: Jest, Testing Library
- **Code Quality**: ESLint, Prettier
- **Font**: Inter (Google Fonts)

## Design System

The project includes a custom design system with:

- **Primary Colors**: Blue palette (50-900)
- **Secondary Colors**: Slate palette (50-900)
- **Typography**: Inter font family
- **Components**: Pre-built button and card styles
- **Dark Mode**: Automatic dark mode support

## Custom CSS Classes

- `.btn-primary` - Primary button styling
- `.btn-secondary` - Secondary button styling
- `.card` - Card component styling

## Environment Variables

Create a `.env.local` file in the root directory for environment-specific variables:

```env
# Add your environment variables here
```

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [React Documentation](https://reactjs.org/) - learn React
- [Tailwind CSS](https://tailwindcss.com/) - utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - typed JavaScript