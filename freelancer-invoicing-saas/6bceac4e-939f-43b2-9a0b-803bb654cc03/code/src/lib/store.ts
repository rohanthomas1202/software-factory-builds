// In-memory data store for the application
import { 
  User, 
  Client, 
  Invoice, 
  Expense, 
  InvoiceStatus,
  ExpenseCategory,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  CreateClientRequest,
  CreateExpenseRequest,
  UpdateUserRequest,
  UpdateClientRequest,
  UpdateExpenseRequest,
  Session
} from '@/types';

// Simple password hashing simulation (in production, use bcrypt)
const hashPassword = (password: string): string => {
  return `hashed_${password}_${Date.now()}`;
};

const verifyPassword = (password: string, hashed: string): boolean => {
  return hashed.startsWith(`hashed_${password}_`);
};

class InMemoryStore {
  private users: Map<string, User> = new Map();
  private clients: Map<string, Client> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private sessions: Map<string, Session> = new Map();
  private userPasswords: Map<string, string> = new Map();
  private invoiceCounter: number = 1000;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed initial data if empty
    if (this.users.size === 0) {
      const userId = 'user_1';
      const user: User = {
        id: userId,
        email: 'demo@example.com',
        name: 'John Doe',
        businessName: 'John Doe Consulting',
        currency: 'USD',
        timezone: 'America/New_York',
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userId, user);
      this.userPasswords.set(userId, hashPassword('password123'));
    }
  }

  // User methods
  async createUser(email: string, password: string, name: string, businessName?: string): Promise<User> {
    // Check if user already exists
    for (const user of this.users.values()) {
      if (user.email === email) {
        throw new Error('User already exists');
      }
    }

    const id = `user_${Date.now()}`;
    const user: User = {
      id,
      email,
      name,
      businessName: businessName || name,
      currency: 'USD',
      timezone: 'America/New_York',
      language: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, user);
    this.userPasswords.set(id, hashPassword(password));
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async verifyUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const hashedPassword = this.userPasswords.get(user.id);
    if (!hashedPassword) return null;

    if (verifyPassword(password, hashedPassword)) {
      return user;
    }
    return null;
  }

  // Client methods
  async createClient(userId: string, data: CreateClientRequest): Promise<Client> {
    const id = `client_${Date.now()}`;
    const client: Client = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.clients.set(id, client);
    return client;
  }

  async getClientById(id: string): Promise<Client | null> {
    return this.clients.get(id) || null;
  }

  async getClientsByUserId(userId: string): Promise<Client[]> {
    const clients: Client[] = [];
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        clients.push(client);
      }
    }
    return clients.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateClient(id: string, updates: UpdateClientRequest): Promise<Client | null> {
    const client = this.clients.get(id);
    if (!client) return null;

    const updatedClient: Client = {
      ...client,
      ...updates,
      updatedAt: new Date(),
    };

    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Invoice methods
  async createInvoice(userId: string, data: CreateInvoiceRequest): Promise<Invoice> {
    const id = `invoice_${Date.now()}`;
    const invoice: Invoice = {
      id,
      userId,
      status: 'draft',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.invoices.set(id, invoice);
    return invoice;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoices.get(id) || null;
  }

  async getInvoicesByUserId(userId: string): Promise<Invoice[]> {
    const invoices: Invoice[] = [];
    for (const invoice of this.invoices.values()) {
      if (invoice.userId === userId) {
        invoices.push(invoice);
      }
    }
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getInvoicesByClientId(clientId: string): Promise<Invoice[]> {
    const invoices: Invoice[] = [];
    for (const invoice of this.invoices.values()) {
      if (invoice.clientId === clientId) {
        invoices.push(invoice);
      }
    }
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateInvoice(id: string, updates: UpdateInvoiceRequest): Promise<Invoice | null> {
    const invoice = this.invoices.get(id);
    if (!invoice) return null;

    const updatedInvoice: Invoice = {
      ...invoice,
      ...updates,
      updatedAt: new Date(),
    };

    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice | null> {
    const invoice = this.invoices.get(id);
    if (!invoice) return null;

    const updates: Partial<Invoice> = { status, updatedAt: new Date() };
    
    if (status === 'sent' && !invoice.sentAt) {
      updates.sentAt = new Date();
    } else if (status === 'paid' && !invoice.paidAt) {
      updates.paidAt = new Date();
    }

    const updatedInvoice: Invoice = {
      ...invoice,
      ...updates,
    };

    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    return this.invoices.delete(id);
  }

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const number = this.invoiceCounter++;
    return `INV-${year}-${number.toString().padStart(4, '0')}`;
  }

  // Expense methods
  async createExpense(userId: string, data: CreateExpenseRequest): Promise<Expense> {
    const id = `expense_${Date.now()}`;
    const expense: Expense = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.expenses.set(id, expense);
    return expense;
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    return this.expenses.get(id) || null;
  }

  async getExpensesByUserId(userId: string): Promise<Expense[]> {
    const expenses: Expense[] = [];
    for (const expense of this.expenses.values()) {
      if (expense.userId === userId) {
        expenses.push(expense);
      }
    }
    return expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async updateExpense(id: string, updates: UpdateExpenseRequest): Promise<Expense | null> {
    const expense = this.expenses.get(id);
    if (!expense) return null;

    const updatedExpense: Expense = {
      ...expense,
      ...updates,
      updatedAt: new Date(),
    };

    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Session methods
  async createSession(userId: string, email: string): Promise<Session> {
    const id = `session_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session: Session = {
      id,
      userId,
      email,
      expiresAt,
      createdAt: new Date(),
    };

    this.sessions.set(id, session);
    return session;
  }

  async getSession(id: string): Promise<Session | null> {
    const session = this.sessions.get(id);
    if (!session) return null;

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(id);
      return null;
    }

    return session;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(id);
      }
    }
  }

  // Dashboard methods
  async getDashboardStats(userId: string): Promise<{
    totalRevenue: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalClients: number;
    recentInvoices: Invoice[];
    revenueTrend: Array<{ month: string; revenue: number }>;
  }> {
    const invoices = await this.getInvoicesByUserId(userId);
    const clients = await this.getClientsByUserId(userId);
    const now = new Date();

    let totalRevenue = 0;
    let pendingInvoices = 0;
    let overdueInvoices = 0;

    // Calculate invoice totals
    for (const invoice of invoices) {
      if (invoice.status === 'paid' && invoice.paidAt) {
        const invoiceTotal = invoice.items.reduce((sum, item) => {
          const itemTotal = item.quantity * item.unitPrice;
          const itemTax = itemTotal * (item.taxRate / 100);
          return sum + itemTotal + itemTax;
        }, 0);
        totalRevenue += invoiceTotal;
      }

      if (invoice.status === 'sent' || invoice.status === 'viewed') {
        pendingInvoices++;
        if (invoice.dueDate < now) {
          overdueInvoices++;
        }
      }
    }

    // Get recent invoices (last 5)
    const recentInvoices = invoices.slice(0, 5);

    // Generate revenue trend (last 6 months)
    const revenueTrend = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const monthRevenue = invoices
        .filter(inv => {
          const invDate = inv.paidAt || inv.createdAt;
          return invDate.getMonth() === date.getMonth() && 
                 invDate.getFullYear() === date.getFullYear() &&
                 inv.status === 'paid';
        })
        .reduce((sum, inv) => {
          return sum + inv.items.reduce((itemSum, item) => {
            const itemTotal = item.quantity * item.unitPrice;
            const itemTax = itemTotal * (item.taxRate / 100);
            return itemSum + itemTotal + itemTax;
          }, 0);
        }, 0);

      return { month, revenue: monthRevenue };
    }).reverse();

    return {
      totalRevenue,
      pendingInvoices,
      overdueInvoices,
      totalClients: clients.length,
      recentInvoices,
      revenueTrend,
    };
  }

  // Report methods
  async getReportData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    period: string;
    startDate: Date;
    endDate: Date;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    invoices: Invoice[];
    expenses: Expense[];
    byCategory: Record<ExpenseCategory, number>;
    byStatus: Record<InvoiceStatus, number>;
  }> {
    const invoices = await this.getInvoicesByUserId(userId);
    const expenses = await this.getExpensesByUserId(userId);

    // Filter by date range
    const filteredInvoices = invoices.filter(inv => {
      const invDate = inv.paidAt || inv.createdAt;
      return invDate >= startDate && invDate <= endDate;
    });

    const filteredExpenses = expenses.filter(exp => {
      return exp.date >= startDate && exp.date <= endDate;
    });

    // Calculate totals
    const totalRevenue = filteredInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => {
        return sum + inv.items.reduce((itemSum, item) => {
          const itemTotal = item.quantity * item.unitPrice;
          const itemTax = itemTotal * (item.taxRate / 100);
          return itemSum + itemTotal + itemTax;
        }, 0);
      }, 0);

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    // Group by category
    const byCategory: Record<ExpenseCategory, number> = {
      office: 0,
      travel: 0,
      software: 0,
      hardware: 0,
      marketing: 0,
      professional: 0,
      other: 0,
    };

    for (const exp of filteredExpenses) {
      byCategory[exp.category] += exp.amount;
    }

    // Group by status
    const byStatus: Record<InvoiceStatus, number> = {
      draft: 0,
      sent: 0,
      viewed: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    };

    for (const inv of filteredInvoices) {
      byStatus[inv.status]++;
    }

    const period = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

    return {
      period,
      startDate,
      endDate,
      totalRevenue,
      totalExpenses,
      netIncome,
      invoices: filteredInvoices,
      expenses: filteredExpenses,
      byCategory,
      byStatus,
    };
  }
}

// Export a singleton instance
export const store = new InMemoryStore();