import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
    title: 'MediLog — Personal Medical Visit Tracker',
    description: 'Securely track your medical history, doctor visits, prescriptions, and health conditions — all in one place.',
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body className="min-h-screen bg-gray-50">
                    {children}
                </body>
            </html>
        </ClerkProvider>
    );
}
