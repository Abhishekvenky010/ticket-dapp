import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import WalletContextProvider from "@/components/WalletProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";

export default function RootLayout({children,}:{children:React.ReactNode}){
      return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <WalletContextProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}