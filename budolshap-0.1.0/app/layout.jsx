import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import { AuthProvider } from "@/context/AuthContext";
import { AuthUIProvider } from "@/context/AuthUIContext";
import { SearchProvider } from "@/context/SearchContext";
import LoginModal from "@/components/LoginModal";
import RealtimeProvider from "@/components/RealtimeProvider";
import KnowledgeBaseShortcut from "@/components/KnowledgeBaseShortcut";
import ExtensionInstaller from "@/components/ExtensionInstaller";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "budolShap. - Best budol Shopping deal ever",
    description: "budolShap. - Best budol Shopping deal ever",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${outfit.className} antialiased`} suppressHydrationWarning={true}>
                <StoreProvider>
                    <AuthUIProvider>
                        <AuthProvider>
                            <SearchProvider>
                                <RealtimeProvider>
                                    <Toaster containerStyle={{ zIndex: 99999 }} />
                                    <LoginModal />
                                    <KnowledgeBaseShortcut />
                                    <ExtensionInstaller />
                                    {children}
                                </RealtimeProvider>
                            </SearchProvider>
                        </AuthProvider>
                    </AuthUIProvider>
                </StoreProvider>
            </body>
        </html>
    );
}
