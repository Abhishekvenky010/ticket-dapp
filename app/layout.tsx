import "./globals.css";
import WalletContextProvider from "@/components/WalletProvider";
export default function RootLayout({children,}:{children:React.ReactNode}){
      return (
    <html lang="en">
      <body>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}