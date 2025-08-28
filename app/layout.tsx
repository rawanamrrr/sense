import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Bodoni_Moda } from 'next/font/google'
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ProductProvider } from "@/lib/product-context"
import { OrderProvider } from "@/lib/order-context"
import { FavoritesProvider } from "@/lib/favorites-context"
import { CartProvider } from "@/lib/cart-context"
import { CartSuccessNotification } from "@/components/cart-success-notification"

// Configure fonts
const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-bodoni-moda',
  display: 'swap',
})

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sense Fragrance - Premium Perfumes & Fragrances",
  description: "Discover our exquisite collection of premium perfumes and fragrances. From classic scents to modern blends, find your perfect fragrance at Sense Fragrance.",
  keywords: "perfume, fragrance, cologne, scent, luxury perfume, premium fragrance",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bodoniModa.variable} font-sans`}>
      <body className={inter.className}>
        <AuthProvider>
          <ProductProvider>
            <OrderProvider>
              <FavoritesProvider>
                <CartProvider>
                  {children}
                  <CartSuccessNotification />
                </CartProvider>
              </FavoritesProvider>
            </OrderProvider>
          </ProductProvider>
        </AuthProvider>
      </body>
    </html>
  )
}