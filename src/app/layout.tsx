import "@/styles/globals.css";
import { Figtree } from "next/font/google";

import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";

import getSongsByUserId from "@/actions/getSongsByUserId";

import SupabaseProvider from "@/providers/SupabaseProvider";
import { ModalProvider } from "@/providers/ModalProvider";
import { UserProvider } from "@/providers/UserProvider";
import { ToasterProvider } from "@/providers/ToasterProvider";
import getActiveProductsWithPrices from "@/actions/getActiveProductsWithPrices";

const font = Figtree({ subsets: ["latin"] });

export const metadata = {
  title: "Spotify Clone",
  description: "Listen to Music",
};

export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  const userSongs = await getSongsByUserId();
  const products = await getActiveProductsWithPrices();

  return (
    <html lang="pt-br">
      <body className={font.className}>
        <ToasterProvider />
        <SupabaseProvider>
          <UserProvider>
            <ModalProvider products={products} />
            <Sidebar songs={userSongs}>
              {children}
            </Sidebar>
            <Player />
          </UserProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
