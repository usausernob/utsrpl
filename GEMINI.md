# SIM LAB App

A Laboratory Management System (SIM LAB) built with Next.js, Prisma, and NextAuth.js. This application facilitates equipment borrowing and room booking for students, with administrative oversight by laboratory assistants (Laboran) and the head of the lab (Kepala Lab).

## Project Overview

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Database ORM:** [Prisma](https://www.prisma.io/) with PostgreSQL
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Core Features

1. **Equipment Borrowing:**
   - Students can request to borrow equipment from the lab.
   - Real-time stock tracking (total vs. available).
   - Workflow: Pending -> Approved (DIPINJAM) -> Returned (SELESAI) or Rejected (DITOLAK).
2. **Room Booking:**
   - Students can book specific laboratory rooms (LAB_RPL, LAB_JARKOM, LAB_MM, LAB_SI) for specific dates and times.
   - Workflow: Pending -> Approved or Rejected.
3. **User Roles:**
   - `MAHASISWA` (Student): Can request equipment and book rooms.
   - `LABORAN` (Lab Assistant) & `KEPALA_LAB` (Head of Lab): Can approve/reject requests and manage returns.

## Getting Started

### Prerequisites

- Node.js (v20 or later recommended)
- PostgreSQL database

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in a `.env` file (see `prisma/schema.prisma` for database connection requirements):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/sim_lab"
   NEXTAUTH_SECRET="your-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

4. (Optional) Seed the database:
   ```bash
   npx prisma db seed
   ```

### Running the Project

- **Development Mode:**
  ```bash
  npm run dev
  ```
- **Production Build:**
  ```bash
  npm run build
  npm start
  ```
- **Linting:**
  ```bash
  npm run lint
  ```

## Project Structure

- `app/`: Next.js App Router directory.
  - `actions/`: Server Actions for business logic (e.g., `laboratorium.ts`).
  - `api/`: API routes (including NextAuth).
  - `components/`: Reusable React components.
  - `dashboard/`: User and Admin dashboard pages.
  - `lib/`: Shared utilities (Prisma client, Auth options).
  - `login/`: Authentication pages.
- `prisma/`: Database schema and migrations.
- `public/`: Static assets.
- `types/`: Custom TypeScript type definitions.

## Development Conventions

- **Server Actions:** All data mutations are handled via Server Actions in `app/actions/`.
- **Database:** Prisma is used for all database interactions. The client is generated in `app/generated/prisma`.
- **Authentication:** Use `getServerSession(authOptions)` for server-side auth checks.
- **Styling:** Use Tailwind CSS for consistent styling.
- **Validation:** Use revalidation (`revalidatePath`) after successful mutations to keep the UI in sync.

## TODO / Planned Improvements

- Refactor `Assets` to `AssetCategory` and add individual `AssetItem` tracking (as requested by user).
- Implement programmatic stock calculation based on individual item status.
- Add prefix-based barcode generation for individual items.
- Enhance administrative UI for managing categories and items.
