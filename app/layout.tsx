import "./globals.css";
import WalletContextProvider from "@/components/WalletProvider";
import Header from "@/components/Header";

export default function RootLayout({children,}:{children:React.ReactNode}){
      return (
    <html lang="en">
      <body className="bg-gray-50">
        <WalletContextProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </WalletContextProvider>
      </body>
    </html>
  );
}