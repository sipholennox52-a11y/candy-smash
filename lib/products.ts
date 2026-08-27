export interface Product {
  id: string
  name: string
  description: string
  // Price in cents to avoid floating-point issues at checkout.
  price: number
  image: string
  tag?: string
}

export const PRODUCTS: Product[] = [
  {
    id: 'rainbow-gummy-bears',
    name: 'Rainbow Gummy Bears',
    description: 'Soft, chewy fruit gummies in six juicy flavors.',
    price: 799,
    image: '/products/gummy-bears.png',
    tag: 'Bestseller',
  },
  {
    id: 'dark-chocolate-truffles',
    name: 'Dark Chocolate Truffles',
    description: 'Velvety 70% cocoa truffles dusted with rich cacao.',
    price: 1499,
    image: '/products/chocolate-truffles.png',
    tag: 'Premium',
  },
  {
    id: 'sour-watermelon-slices',
    name: 'Sour Watermelon Slices',
    description: 'Tangy sugar-coated slices with a sour kick.',
    price: 699,
    image: '/products/watermelon-slices.png',
  },
  {
    id: 'caramel-sea-salt-lollipops',
    name: 'Caramel Sea Salt Lollipops',
    description: 'Buttery caramel pops finished with flaky sea salt.',
    price: 899,
    image: '/products/caramel-lollipops.png',
  },
  {
    id: 'strawberry-bonbons',
    name: 'Strawberry Bonbons',
    description: 'Creamy strawberry centers in a classic hard shell.',
    price: 649,
    image: '/products/strawberry-bonbons.png',
  },
  {
    id: 'deluxe-candy-gift-box',
    name: 'Deluxe Candy Gift Box',
    description: 'An assorted box of our finest sweets, ready to gift.',
    price: 2999,
    image: '/products/candy-gift-box.png',
    tag: 'Gift',
  },
]

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
