export function databaseConfigured(){return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)}
export function submissionsConfigured(){return databaseConfigured() && !!process.env.SUPABASE_SERVICE_ROLE_KEY && (process.env.RATE_LIMIT_SALT?.length ?? 0)>=32}
