import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // const stock: Stock = await api.get('/stock', { params: { id: productId }})
      //   .then(response => response.data[0]);

      // if (!stock) {
      //   toast.error('Erro na adição do produto');
      //   return;
      // }

      // if (stock.amount <= 0) {
      //   toast.error('Quantidade solicitada fora de estoque');
      //   return;
      // }

      const cartProduct = cart.find(c => c.id === productId);

      if (cartProduct) {
        updateProductAmount({ productId, amount: cartProduct.amount + 1 });
      } else {
        const product: Product = await api.get(`/products/${productId}`)
          .then( response => response.data);

        const newCart = [...cart, {...product, amount: 1}];
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (cart.find(c => c.id === productId)) {
        const newCart = cart.filter(c => c.id !== productId);
        setCart([...newCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else
        toast.error('Erro na remoção do produto');
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const stockedProduct: Stock = await api.get(`/stock/${productId}`)
        .then( response => response.data);

      // if (!stockedProduct) {
      //   toast.error('Erro na alteração de quantidade do produto');
      //   return;  
      // }
      
      if (amount > stockedProduct.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map(product => {
        if (product.id === productId)
          product.amount = amount;
        return product;
      });

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
