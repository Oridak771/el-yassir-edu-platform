# El Yassir Education Platform

This is a [Next.js](https://nextjs.org) project for an education administration platform, bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd el-yassir-edu-platform
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up Supabase
   - Go to [Supabase](https://supabase.com/) and create a new project.
   - In your Supabase project, go to the SQL Editor and run the schema migrations located in the `supabase/migrations` folder of this project. Start with `20250505231115_initial_schema.sql`.
   - Obtain your Supabase Project URL and Anon Key:
     - Go to Project Settings > API.
     - Find your Project URL and `anon` public key.
   - Create a `.env.local` file in the root of your project and add your Supabase credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
     ```
   - **Important**: Make sure to configure Row Level Security (RLS) policies in your Supabase tables as defined in the migration files to ensure data security and role-based access.

### 4. Run the Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Tech Stack
- **Frontend**: Next.js (TypeScript) + Tailwind CSS + ShadCN UI
- **Backend/DB/Auth**: Supabase (PostgreSQL) with Auth, Realtime, Storage
- **Charts**: Recharts
- **Calendar/Scheduling**: FullCalendar.io
- **PDF**: pdf-lib
- **Notifications**: Supabase Realtime subscriptions

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
"# El-Yassir" 
