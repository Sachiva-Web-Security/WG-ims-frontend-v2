// Root page — middleware handles redirect based on role
// This is just a fallback loading screen
export default function RootPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin" />
        </div>
    );
}
