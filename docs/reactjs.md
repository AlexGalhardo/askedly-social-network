# Guia Completo dos Hooks Nativos do React

Este guia aborda os principais hooks nativos do React com explicações detalhadas e exemplos práticos para programadores iniciantes.

# useRef

O `useRef` é um hook que permite criar uma referência mutável que persiste durante todo o ciclo de vida do componente. Diferente do estado, mudanças no `useRef` não causam re-renderização.

## Quando usar

- Acessar elementos DOM diretamente
- Armazenar valores que não devem causar re-render
- Manter referências de timers, intervalos ou outras APIs
- Focar em inputs, scroll, animações

### 1. Exemplo Simples - Focar em um input

```typescript
import React, { useRef } from 'react';

const SimpleRefExample: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <input ref={inputRef} type="text" placeholder="Digite algo..." />
      <button onClick={focusInput}>Focar no Input</button>
    </div>
  );
};
```

### 2. Exemplo Médio - Contador sem re-render

```typescript
import React, { useRef, useState } from 'react';

const CounterWithoutRerender: React.FC = () => {
  const countRef = useRef(0);
  const [renderCount, setRenderCount] = useState(0);

  const incrementRef = () => {
    countRef.current += 1;
    console.log('Contador ref:', countRef.current);
  };

  const forceRerender = () => {
    setRenderCount(prev => prev + 1);
  };

  return (
    <div>
      <p>Renders: {renderCount}</p>
      <p>Contador ref atual: {countRef.current}</p>
      <button onClick={incrementRef}>Incrementar Ref (sem re-render)</button>
      <button onClick={forceRerender}>Forçar Re-render</button>
    </div>
  );
};
```

### 3. Exemplo Complexo - Timer com cleanup

```typescript
import React, { useRef, useState, useEffect } from 'react';

const TimerWithRef: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startTimer = () => {
    if (!isRunning) {
      startTimeRef.current = Date.now() - seconds * 1000;
      intervalRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
      setIsRunning(true);
    }
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  };

  const resetTimer = () => {
    stopTimer();
    setSeconds(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div>
      <h2>Timer: {seconds}s</h2>
      <button onClick={startTimer} disabled={isRunning}>Start</button>
      <button onClick={stopTimer} disabled={!isRunning}>Stop</button>
      <button onClick={resetTimer}>Reset</button>
    </div>
  );
};
```

# useCallback

O useCallback memoriza uma função e só a recria quando suas dependências mudam. Útil para otimizar performance evitando re-criação desnecessária de funções.

Quando usar:

- Passar funções como props para componentes filhos
- Evitar re-renders desnecessários em componentes otimizados
- Funções que são dependências de outros hooks
- Callbacks custosos que não precisam ser recriados

### 1. Exemplo Simples - Callback básico

```typescript
import React, { useState, useCallback } from 'react';

const SimpleCallback: React.FC = () => {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []); // Sem dependências, função nunca muda

  return (
    <div>
      <p>Count: {count}</p>
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)}
        placeholder="Digite seu nome"
      />
      <button onClick={increment}>Incrementar</button>
    </div>
  );
};
```

### 2. Exemplo Médio - Evitando re-renders

```typescript
import React, { useState, useCallback, memo } from 'react';

interface ChildProps {
  onButtonClick: () => void;
  title: string;
}

const ExpensiveChild = memo<ChildProps>(({ onButtonClick, title }) => {
  console.log('Child renderizado!');
  return (
    <div>
      <h3>{title}</h3>
      <button onClick={onButtonClick}>Clique aqui</button>
    </div>
  );
});

const CallbackOptimization: React.FC = () => {
  const [count, setCount] = useState(0);
  const [otherState, setOtherState] = useState('');

  const handleButtonClick = useCallback(() => {
    setCount(prev => prev + 1);
  }, []); // Child só re-renderiza quando count muda via botão

  return (
    <div>
      <p>Count: {count}</p>
      <input 
        value={otherState}
        onChange={(e) => setOtherState(e.target.value)}
        placeholder="Isso não afeta o child"
      />
      <ExpensiveChild 
        onButtonClick={handleButtonClick}
        title="Componente Otimizado"
      />
    </div>
  );
};
```

### 3. Exemplo Complexo - Callback com dependências

```typescript
import React, { useState, useCallback, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email'>('name');

  const fetchUsers = useCallback(async () => {
    // Simula API call
    const mockUsers: User[] = [
      { id: 1, name: 'João', email: 'joao@email.com' },
      { id: 2, name: 'Maria', email: 'maria@email.com' },
      { id: 3, name: 'Pedro', email: 'pedro@email.com' },
    ];
    setUsers(mockUsers);
  }, []);

  const filteredAndSortedUsers = useCallback(() => {
    return users
      .filter(user => 
        user.name.toLowerCase().includes(filter.toLowerCase()) ||
        user.email.toLowerCase().includes(filter.toLowerCase())
      )
      .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
  }, [users, filter, sortBy]); // Recria quando dependências mudam

  const deleteUser = useCallback((id: number) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const processedUsers = filteredAndSortedUsers();

  return (
    <div>
      <input 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filtrar usuários..."
      />
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'email')}>
        <option value="name">Ordenar por Nome</option>
        <option value="email">Ordenar por Email</option>
      </select>
      
      {processedUsers.map(user => (
        <div key={user.id}>
          <span>{user.name} - {user.email}</span>
          <button onClick={() => deleteUser(user.id)}>Deletar</button>
        </div>
      ))}
    </div>
  );
};
```

# useMemo

O useMemo memoriza o resultado de um cálculo custoso e só o recalcula quando suas dependências mudam. Otimiza performance evitando cálculos desnecessários.

## Quando usar

- Cálculos custosos que não precisam ser refeitos a cada render
- Transformações de dados complexas
- Filtragem e ordenação de listas grandes
- Criação de objetos/arrays que são passados como props

### 1. Exemplo Simples - Cálculo básico

```typescript
import React, { useState, useMemo } from 'react';

const SimpleMemo: React.FC = () => {
  const [number, setNumber] = useState(1);
  const [dark, setDark] = useState(false);

  const expensiveValue = useMemo(() => {
    console.log('Calculando...');
    return number * 2;
  }, [number]); // Só recalcula quando number muda

  const themeStyles = {
    backgroundColor: dark ? '#333' : '#FFF',
    color: dark ? '#FFF' : '#333'
  };

  return (
    <div style={themeStyles}>
      <input 
        type="number" 
        value={number} 
        onChange={(e) => setNumber(parseInt(e.target.value))}
      />
      <p>Valor calculado: {expensiveValue}</p>
      <button onClick={() => setDark(!dark)}>
        Alternar tema (não recalcula)
      </button>
    </div>
  );
};
```

### 2. Exemplo Médio - Filtragem de lista

```typescript
import React, { useState, useMemo } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const ProductList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const products: Product[] = [
    { id: 1, name: 'Notebook', price: 2500, category: 'electronics' },
    { id: 2, name: 'Mouse', price: 50, category: 'electronics' },
    { id: 3, name: 'Livro', price: 30, category: 'books' },
    { id: 4, name: 'Cadeira', price: 200, category: 'furniture' },
    { id: 5, name: 'Mesa', price: 400, category: 'furniture' },
  ];

  const filteredProducts = useMemo(() => {
    console.log('Filtrando produtos...');
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = product.price >= minPrice;
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      
      return matchesSearch && matchesPrice && matchesCategory;
    });
  }, [searchTerm, minPrice, selectedCategory]); // Só refiltra quando filtros mudam

  const categories = useMemo(() => {
    return [...new Set(products.map(p => p.category))];
  }, []); // Lista de categorias únicas, calculada uma vez

  return (
    <div>
      <input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar produtos..."
      />
      
      <input 
        type="number"
        value={minPrice}
        onChange={(e) => setMinPrice(Number(e.target.value))}
        placeholder="Preço mínimo"
      />
      
      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
        <option value="all">Todas categorias</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <div>
        {filteredProducts.map(product => (
          <div key={product.id}>
            {product.name} - R$ {product.price} ({product.category})
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Exemplo Complexo - Dashboard com múltiplos cálculos

```typescript
import React, { useState, useMemo } from 'react';

interface Sale {
  id: number;
  date: string;
  amount: number;
  category: string;
  salesperson: string;
}

const SalesDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-12-31' });
  const [selectedSalesperson, setSelectedSalesperson] = useState('all');

  const sales: Sale[] = [
    { id: 1, date: '2024-01-15', amount: 1000, category: 'electronics', salesperson: 'João' },
    { id: 2, date: '2024-02-20', amount: 1500, category: 'clothing', salesperson: 'Maria' },
    { id: 3, date: '2024-03-10', amount: 800, category: 'electronics', salesperson: 'João' },
    { id: 4, date: '2024-04-05', amount: 2000, category: 'furniture', salesperson: 'Pedro' },
    { id: 5, date: '2024-05-12', amount: 1200, category: 'clothing', salesperson: 'Maria' },
  ];

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      const inDateRange = saleDate >= startDate && saleDate <= endDate;
      const matchesSalesperson = selectedSalesperson === 'all' || sale.salesperson === selectedSalesperson;
      
      return inDateRange && matchesSalesperson;
    });
  }, [sales, dateRange, selectedSalesperson]);

  const analytics = useMemo(() => {
    console.log('Calculando analytics...');
    
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
    const averageSale = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
    
    const salesByCategory = filteredSales.reduce((acc, sale) => {
      acc[sale.category] = (acc[sale.category] || 0) + sale.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const salesBySalesperson = filteredSales.reduce((acc, sale) => {
      acc[sale.salesperson] = (acc[sale.salesperson] || 0) + sale.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(salesByCategory)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
    
    return {
      totalRevenue,
      averageSale,
      salesByCategory,
      salesBySalesperson,
      topCategory,
      totalSales: filteredSales.length
    };
  }, [filteredSales]); // Só recalcula quando vendas filtradas mudam

  const salespeople = useMemo(() => {
    return [...new Set(sales.map(s => s.salesperson))];
  }, []);

  return (
    <div>
      <h2>Dashboard de Vendas</h2>
      
      <div>
        <input 
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
        />
        <input 
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
        />
        
        <select value={selectedSalesperson} onChange={(e) => setSelectedSalesperson(e.target.value)}>
          <option value="all">Todos vendedores</option>
          {salespeople.map(person => (
            <option key={person} value={person}>{person}</option>
          ))}
        </select>
      </div>

      <div>
        <h3>Resumo</h3>
        <p>Total de Vendas: {analytics.totalSales}</p>
        <p>Receita Total: R$ {analytics.totalRevenue.toFixed(2)}</p>
        <p>Venda Média: R$ {analytics.averageSale.toFixed(2)}</p>
        <p>Categoria Top: {analytics.topCategory}</p>
        
        <h4>Por Categoria:</h4>
        {Object.entries(analytics.salesByCategory).map(([category, amount]) => (
          <p key={category}>{category}: R$ {amount.toFixed(2)}</p>
        ))}
        
        <h4>Por Vendedor:</h4>
        {Object.entries(analytics.salesBySalesperson).map(([person, amount]) => (
          <p key={person}>{person}: R$ {amount.toFixed(2)}</p>
        ))}
      </div>
    </div>
  );
};
```

# useContext

O useContext permite consumir dados de um Context sem precisar usar o Consumer. Facilita o compartilhamento de estado entre componentes distantes na árvore.

## Quando usar

- Compartilhar estado global (tema, autenticação, idioma)
- Evitar prop drilling (passar props por muitos níveis)
- Configurações da aplicação
- Estado de UI global (modais, notificações)

### 1. Exemplo Simples - Tema da aplicação

```typescript
import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
};

const ThemedButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  const styles = {
    backgroundColor: theme === 'light' ? '#fff' : '#333',
    color: theme === 'light' ? '#333' : '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px'
  };

  return (
    <button style={styles} onClick={toggleTheme}>
      Tema atual: {theme}
    </button>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <div>
        <h1>Minha App</h1>
        <ThemedButton />
      </div>
    </ThemeProvider>
  );
};
```

### 2. Exemplo Médio - Sistema de autenticação

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula verificação de token salvo
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simula API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'admin@test.com' && password === '123') {
      const userData: User = {
        id: 1,
        name: 'Admin',
        email: 'admin@test.com',
        role: 'admin'
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (!success) {
      alert('Credenciais inválidas');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        disabled={isLoading}
      />
      <input 
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h2>Bem-vindo, {user?.name}!</h2>
      <p>Email: {user?.email}</p>
      <p>Papel: {user?.role}</p>
      <button onClick={logout}>Sair</button>
    </div>
  );
};

const AuthApp: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return user ? <Dashboard /> : <LoginForm />;
};
```

### 3. Exemplo Complexo - Sistema de carrinho de compras

```typescript
import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return calculateTotals({ ...state, items: updatedItems });
      }
      
      const newItems = [...state.items, { ...action.payload, quantity: 1 }];
      return calculateTotals({ ...state, items: newItems });
    }
    
    case 'REMOVE_ITEM': {
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      return calculateTotals({ ...state, items: filteredItems });
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);
      
      return calculateTotals({ ...state, items: updatedItems });
    }
    
    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };
    
    case 'LOAD_CART':
      return calculateTotals({ ...state, items: action.payload });
    
    default:
      return state;
  }
};

const calculateTotals = (state: CartState): CartState => {
  const total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  return { ...state, total, itemCount };
};

interface CartContextType extends CartState {
  addItem: (product: Product) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0
  });

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      dispatch({ type: 'LOAD_CART', payload: JSON.parse(savedCart) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{
      ...state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de CartProvider');
  }
  return context;
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addItem } = useCart();

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
      <h3>{product.name}</h3>
      <p>R$ {product.price.toFixed(2)}</p>
      <button onClick={() => addItem(product)}>
        Adicionar ao Carrinho
      </button>
    </div>
  );
};

const CartSummary: React.FC = () => {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return <div>Carrinho vazio</div>;
  }

  return (
    <div>
      <h2>Carrinho ({itemCount} itens)</h2>
      {items.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>{item.name}</span>
          <input 
            type="number"
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
            min="1"
          />
          <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
          <button onClick={() => removeItem(item.id)}>Remover</button>
        </div>
      ))}
      <div>
        <strong>Total: R$ {total.toFixed(2)}</strong>
      </div>
      <button onClick={clearCart}>Limpar Carrinho</button>
    </div>
  );
};

const ShoppingApp: React.FC = () => {
  const products: Product[] = [
    { id: 1, name: 'Notebook', price: 2500, image: '' },
    { id: 2, name: 'Mouse', price: 50, image: '' },
    { id: 3, name: 'Teclado', price: 150, image: '' },
  ];

  return (
    <CartProvider>
      <div style={{ display: 'flex' }}>
        <div>
          <h2>Produtos</h2>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div style={{ marginLeft: '50px' }}>
          <CartSummary />
        </div>
      </div>
    </CartProvider>
  );
};
```

# useReducer

O useReducer é uma alternativa ao useState para gerenciar estado complexo. Usa o padrão reducer (similar ao Redux) para atualizações de estado mais previsíveis.

## Quando usar

- Estado complexo com múltiplas sub-propriedades
- Lógica de atualização de estado complexa
- Múltiplas ações que afetam o mesmo estado
- Quando useState se torna difícil de gerenciar

### 1. Exemplo Simples - Contador com múltiplas ações

```typescript
import React, { useReducer } from 'react';

interface CounterState {
  count: number;
}

type CounterAction = 
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'RESET' }
  | { type: 'SET_VALUE'; payload: number };

const counterReducer = (state: CounterState, action: CounterAction): CounterState => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    case 'RESET':
      return { count: 0 };
    case 'SET_VALUE':
      return { count: action.payload };
    default:
      return state;
  }
};

const SimpleCounter: React.FC = () => {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  return (
    <div>
      <p>Contador: {state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
      <button onClick={() => dispatch({ type: 'RESET' })}>Reset</button>
      <button onClick={() => dispatch({ type: 'SET_VALUE', payload: 10 })}>
        Definir como 10
      </button>
    </div>
  );
};
```

### 2. Exemplo Médio - Formulário complexo

```typescript
import React, { useReducer } from 'react';

interface FormState {
  values: {
    name: string;
    email: string;
    age: number;
    country: string;
  };
  errors: {
    name?: string;
    email?: string;
    age?: string;
    country?: string;
  };
  isSubmitting: boolean;
  isSubmitted: boolean;
}

type FormAction = 
  | { type: 'SET_FIELD'; field: keyof FormState['values']; value: string | number }
  | { type: 'SET_ERROR'; field: keyof FormState['errors']; error: string }
  | { type: 'CLEAR_ERROR'; field: keyof FormState['errors'] }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'RESET_FORM' };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: {
          ...state.values,
          [action.field]: action.value
        }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.field]: action.error
        }
      };
    
    case 'CLEAR_ERROR':
      const { [action.field]: _, ...restErrors } = state.errors;
      return {
        ...state,
        errors: restErrors
      };
    
    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.isSubmitting
      };
    
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        isSubmitting: false,
        isSubmitted: true
      };
    
    case 'RESET_FORM':
      return {
        values: { name: '', email: '', age: 0, country: '' },
        errors: {},
        isSubmitting: false,
        isSubmitted: false
      };
    
    default:
      return state;
  }
};

const ComplexForm: React.FC = () => {
  const [state, dispatch] = useReducer(formReducer, {
    values: { name: '', email: '', age: 0, country: '' },
    errors: {},
    isSubmitting: false,
    isSubmitted: false
  });

  const validateField = (field: keyof FormState['values'], value: string | number) => {
    switch (field) {
      case 'name':
        if (!value || (value as string).length < 2) {
          dispatch({ type: 'SET_ERROR', field, error: 'Nome deve ter pelo menos 2 caracteres' });
        } else {
          dispatch({ type: 'CLEAR_ERROR', field });
        }
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value as string)) {
          dispatch({ type: 'SET_ERROR', field, error: 'Email inválido' });
        } else {
          dispatch({ type: 'CLEAR_ERROR', field });
        }
        break;
      
      case 'age':
        if (value < 18 || value > 100) {
          dispatch({ type: 'SET_ERROR', field, error: 'Idade deve estar entre 18 e 100 anos' });
        } else {
          dispatch({ type: 'CLEAR_ERROR', field });
        }
        break;
    }
  };

  const handleFieldChange = (field: keyof FormState['values'], value: string | number) => {
    dispatch({ type: 'SET_FIELD', field, value });
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(state.errors).length > 0) {
      return;
    }

    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
    
    // Simula envio
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    dispatch({ type: 'SUBMIT_SUCCESS' });
  };

  if (state.isSubmitted) {
    return (
      <div>
        <h2>Formulário enviado com sucesso!</h2>
        <button onClick={() => dispatch({ type: 'RESET_FORM' })}>
          Enviar outro
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input 
          type="text"
          placeholder="Nome"
          value={state.values.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
        />
        {state.errors.name && <span style={{color: 'red'}}>{state.errors.name}</span>}
      </div>

      <div>
        <input 
          type="email"
          placeholder="Email"
          value={state.values.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
        />
        {state.errors.email && <span style={{color: 'red'}}>{state.errors.email}</span>}
      </div>

      <div>
        <input 
          type="number"
          placeholder="Idade"
          value={state.values.age}
          onChange={(e) => handleFieldChange('age', parseInt(e.target.value))}
        />
        {state.errors.age && <span style={{color: 'red'}}>{state.errors.age}</span>}
      </div>

      <div>
        <select 
          value={state.values.country}
          onChange={(e) => handleFieldChange('country', e.target.value)}
        >
          <option value="">Selecione um país</option>
          <option value="BR">Brasil</option>
          <option value="US">Estados Unidos</option>
          <option value="CA">Canadá</option>
        </select>
        {state.errors.country && <span style={{color: 'red'}}>{state.errors.country}</span>}
      </div>

      <button type="submit" disabled={state.isSubmitting || Object.keys(state.errors).length > 0}>
        {state.isSubmitting ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
};
```

### 3. Exemplo Complexo - Gerenciador de tarefas

```typescript
import React, { useReducer, useEffect } from 'react';

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
}

interface TaskState {
  tasks: Task[];
  filter: 'all' | 'completed' | 'pending';
  sortBy: 'dueDate' | 'priority' | 'createdAt';
  searchTerm: string;
  isLoading: boolean;
  error: string | null;
}

type TaskAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'createdAt'> }
  | { type: 'UPDATE_TASK'; payload: { id: number; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: number }
  | { type: 'TOGGLE_TASK'; payload: number }
  | { type: 'SET_FILTER'; payload: TaskState['filter'] }
  | { type: 'SET_SORT'; payload: TaskState['sortBy'] }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'CLEAR_COMPLETED' };

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'LOAD_TASKS':
      return { ...state, tasks: action.payload, isLoading: false };
    
    case 'ADD_TASK':
      const newTask: Task = {
        ...action.payload,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      return { ...state, tasks: [...state.tasks, newTask] };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        )
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, completed: !task.completed }
            : task
        )
      };
    
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    
    case 'SET_SORT':
      return { ...state, sortBy: action.payload };
    
    case 'SET_SEARCH':
      return { ...state, searchTerm: action.payload };
    
    case 'CLEAR_COMPLETED':
      return {
        ...state,
        tasks: state.tasks.filter(task => !task.completed)
      };
    
    default:
      return state;
  }
};

const TaskManager: React.FC = () => {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: [],
    filter: 'all',
    sortBy: 'dueDate',
    searchTerm: '',
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Simula carregamento de tarefas
    const loadTasks = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Simula API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockTasks: Task[] = [
          {
            id: 1,
            title: 'Estudar React',
            description: 'Aprender hooks avançados',
            completed: false,
            priority: 'high',
            dueDate: '2024-12-31',
            createdAt: '2024-12-01T10:00:00Z'
          },
          {
            id: 2,
            title: 'Fazer compras',
            description: 'Comprar ingredientes para o jantar',
            completed: true,
            priority: 'medium',
            dueDate: '2024-12-25',
            createdAt: '2024-12-20T15:30:00Z'
          }
        ];
        
        dispatch({ type: 'LOAD_TASKS', payload: mockTasks });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar tarefas' });
      }
    };

    loadTasks();
  }, []);

  const filteredAndSortedTasks = React.useMemo(() => {
    let filtered = state.tasks;

    // Filtrar por status
    if (state.filter === 'completed') {
      filtered = filtered.filter(task => task.completed);
    } else if (state.filter === 'pending') {
      filtered = filtered.filter(task => !task.completed);
    }

    // Filtrar por busca
    if (state.searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [state.tasks, state.filter, state.searchTerm, state.sortBy]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    dispatch({ type: 'ADD_TASK', payload: taskData });
  };

  if (state.isLoading) {
    return <div>Carregando tarefas...</div>;
  }

  if (state.error) {
    return <div>Erro: {state.error}</div>;
  }

  return (
    <div>
      <h1>Gerenciador de Tarefas</h1>
      
      {/* Controles */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text"
          placeholder="Buscar tarefas..."
          value={state.searchTerm}
          onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
        />
        
        <select 
          value={state.filter}
          onChange={(e) => dispatch({ type: 'SET_FILTER', payload: e.target.value as TaskState['filter'] })}
        >
          <option value="all">Todas</option>
          <option value="pending">Pendentes</option>
          <option value="completed">Concluídas</option>
        </select>
        
        <select 
          value={state.sortBy}
          onChange={(e) => dispatch({ type: 'SET_SORT', payload: e.target.value as TaskState['sortBy'] })}
        >
          <option value="dueDate">Data de Vencimento</option>
          <option value="priority">Prioridade</option>
          <option value="createdAt">Data de Criação</option>
        </select>
        
        <button onClick={() => dispatch({ type: 'CLEAR_COMPLETED' })}>
          Limpar Concluídas
        </button>
      </div>

      {/* Lista de tarefas */}
      <div>
        {filteredAndSortedTasks.map(task => (
          <div key={task.id} style={{ 
            border: '1px solid #ccc', 
            padding: '10px', 
            margin: '10px 0',
            backgroundColor: task.completed ? '#f0f0f0' : 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox"
                checked={task.completed}
                onChange={() => dispatch({ type: 'TOGGLE_TASK', payload: task.id })}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                  {task.title}
                </h3>
                <p>{task.description}</p>
                <small>
                  Prioridade: {task.priority} | 
                  Vencimento: {new Date(task.dueDate).toLocaleDateString()}
                </small>
              </div>
              <button onClick={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}>
                Deletar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulário para nova tarefa */}
      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
        <h3>Nova Tarefa</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          addTask({
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            priority: formData.get('priority') as 'low' | 'medium' | 'high',
            dueDate: formData.get('dueDate') as string,
            completed: false
          });
          e.currentTarget.reset();
        }}>
          <input name="title" placeholder="Título" required />
          <input name="description" placeholder="Descrição" />
          <select name="priority" required>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
          <input name="dueDate" type="date" required />
          <button type="submit">Adicionar</button>
        </form>
      </div>
    </div>
  );
};
```

# useDebounce

O useDebounce não é um hook nativo do React, mas é um hook customizado muito comum que atrasa a execução de uma função até que ela pare de ser chamada por um período específico.

## Quando usar

- Busca em tempo real (search as you type)
- Validação de formulários
- Chamadas de API que não devem ser feitas a cada keystroke
- Redimensionamento de janela
- Scroll events

### 1. Exemplo Simples - Hook customizado básico

```typescript
import React, { useState, useEffect } from 'react';

// Hook customizado useDebounce
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SimpleDebounceExample: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      console.log('Buscando por:', debouncedSearchTerm);
      // Aqui faria a chamada da API
    }
  }, [debouncedSearchTerm]);

  return (
    <div>
      <input 
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Digite para buscar..."
      />
      <p>Termo de busca: {searchTerm}</p>
      <p>Termo debounced: {debouncedSearchTerm}</p>
    </div>
  );
};
```

### 2. Exemplo Médio - Busca de usuários com API

```typescript
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
}

const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const UserSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearchTerm.trim()) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Simula chamada de API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockUsers: User[] = [
          { id: 1, name: 'João Silva', email: 'joao@email.com', username: 'joao123' },
          { id: 2, name: 'Maria Santos', email: 'maria@email.com', username: 'maria456' },
          { id: 3, name: 'Pedro Oliveira', email: 'pedro@email.com', username: 'pedro789' },
        ];

        const filteredUsers = mockUsers.filter(user =>
          user.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );

        setUsers(filteredUsers);
      } catch (err) {
        setError('Erro ao buscar usuários');
      } finally {
        setIsLoading(false);
      }
    };

    searchUsers();
  }, [debouncedSearchTerm]);

  return (
    <div>
      <h2>Busca de Usuários</h2>
      <input 
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar usuários..."
        style={{ width: '300px', padding: '8px' }}
      />
      
      {isLoading && <p>Buscando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div>
        {users.map(user => (
          <div key={user.id} style={{ 
            border: '1px solid #ccc', 
            padding: '10px', 
            margin: '5px 0' 
          }}>
            <h4>{user.name}</h4>
            <p>Email: {user.email}</p>
            <p>Username: {user.username}</p>
          </div>
        ))}
        
        {debouncedSearchTerm && users.length === 0 && !isLoading && (
          <p>Nenhum usuário encontrado</p>
        )}
      </div>
    </div>
  );
};
```
