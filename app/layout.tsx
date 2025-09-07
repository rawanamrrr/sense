import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Playfair_Display, Crimson_Text } from 'next/font/google'
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ProductProvider } from "@/lib/product-context"
import { OrderProvider } from "@/lib/order-context"
import { FavoritesProvider } from "@/lib/favorites-context"
import { CartProvider } from "@/lib/cart-context"
import { CartSuccessNotification } from "@/components/cart-success-notification"

// Configure fonts
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair-display',
  display: 'swap',
})

const crimsonText = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-crimson-text',
  display: 'swap',
})

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sense - Premium Perfumes & Fragrances",
  description: "Discover our exquisite collection of premium perfumes and fragrances. From classic scents to modern blends, find your perfect fragrance at Sense.",
  keywords: "perfume, fragrance, cologne, scent, luxury perfume, premium fragrance",
  generator: 'sense',
  icons: {
    icon: '/logo-icon-modern-black.png',
    shortcut: '/logo-icon-modern-black.png',
    apple: '/logo-icon-modern-black.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${crimsonText.variable}`}>
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