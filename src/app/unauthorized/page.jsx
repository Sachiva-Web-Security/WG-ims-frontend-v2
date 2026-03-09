export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <p className="text-6xl mb-4">🚫</p>
                <h1 className="text-2xl font-bold text-gray-700">Access Denied</h1>
                <p className="text-gray-500 mt-2">You don&apos;t have permission to view this page.</p>
                <a href="/login" className="btn-primary mt-6 inline-flex">Back to Login</a>
            </div>
        </div>
    );
}
