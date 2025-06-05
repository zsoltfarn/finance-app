import React, { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
}

interface DashboardProps {
  profileId: number;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profileId }) => {
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [outgoings, setOutgoings] = useState<Transaction[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'income' | 'outgoing'>('income');
  const [error, setError] = useState<string | null>(null);
  const [loadingIncomes, setLoadingIncomes] = useState(false);
  const [loadingOutgoings, setLoadingOutgoings] = useState(false);

  const apiBaseUrl = 'http://localhost:3001/api';

  const fetchTransactions = useCallback(async (type: 'incomes' | 'outgoings') => {
    const setLoading = type === 'incomes' ? setLoadingIncomes : setLoadingOutgoings;
    const setData = type === 'incomes' ? setIncomes : setOutgoings;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/${type}/${profileId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setData(data);
    } catch (err) {
      console.error(`Failed to fetch ${type}:`, err);
      setError(`Failed to load ${type}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [profileId, apiBaseUrl]);

  useEffect(() => {
    if (profileId) {
      fetchTransactions('incomes');
      fetchTransactions('outgoings');
    }
  }, [profileId, fetchTransactions]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!description || !amount || !date) {
      setError('All fields are required.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    const endpoint = type === 'income' ? 'incomes' : 'outgoings';
    try {
      const response = await fetch(`${apiBaseUrl}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, description, amount: numericAmount, date }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setDescription('');
      setAmount('');
      fetchTransactions(endpoint);
    } catch (err) {
      console.error('Transaction submission error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  const handleDelete = async (transactionId: number, transactionType: 'income' | 'outgoing') => {
    setError(null);
    const endpoint = `${transactionType}s`;
    
    try {
      const response = await fetch(`${apiBaseUrl}/${endpoint}/${transactionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      fetchTransactions(endpoint);
    } catch (err) {
      console.error(`Error deleting ${transactionType}:`, err);
      setError(err instanceof Error ? err.message : `Failed to delete ${transactionType}.`);
    }
  };

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalOutgoing = outgoings.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalOutgoing;

  const getChartData = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    }).reverse();

    const monthlyData = last6Months.map(month => {
      const monthIncome = incomes
        .filter(t => {
          const transDate = new Date(t.date);
          return transDate.toLocaleString('default', { month: 'short', year: 'numeric' }) === month;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const monthOutgoing = outgoings
        .filter(t => {
          const transDate = new Date(t.date);
          return transDate.toLocaleString('default', { month: 'short', year: 'numeric' }) === month;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month,
        Income: monthIncome,
        Expense: monthOutgoing,
        Balance: monthIncome - monthOutgoing
      };
    });

    return monthlyData;
  };

  const renderTransactionList = (transactions: Transaction[], transactionType: 'income' | 'outgoing') => (
    <ul className="transaction-list">
      {transactions.map((item) => (
        <li key={item.id} className="transaction-item">
          <div className="transaction-info">
            <div className="transaction-description">{item.description}</div>
            <div className="transaction-details">
              €{item.amount.toFixed(2)} • {new Date(item.date).toLocaleDateString()}
            </div>
          </div>
          <button
            onClick={() => handleDelete(item.id, transactionType)}
            className="delete-btn"
            title="Delete transaction"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="dashboard-container">
      {error && <div className="error-message">{error}</div>}

      <div className="form-card">
        <h3>Add New Transaction</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select 
                id="type" 
                value={type} 
                onChange={(e) => setType(e.target.value as 'income' | 'outgoing')}
              >
                <option value="income">Income</option>
                <option value="outgoing">Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <button type="submit">Add {type === 'income' ? 'Income' : 'Expense'}</button>
        </form>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Income</h4>
          <div className="stat-value income">€{totalIncome.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <h4>Total Expenses</h4>
          <div className="stat-value expense">€{totalOutgoing.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <h4>Balance</h4>
          <div className={`stat-value balance ${balance < 0 ? 'negative' : ''}`}>
            €{balance.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Financial Overview - Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis 
              tick={{ fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(value) => `€${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [`€${value.toFixed(2)}`, '']}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                fontSize: '14px'
              }}
            />
            <Bar 
              dataKey="Income" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar 
              dataKey="Expense" 
              fill="#f59e0b" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar 
              dataKey="Balance" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="transactions-grid">
        <div className="transaction-card">
          <h3>Recent Income</h3>
          {loadingIncomes ? (
            <div className="loading-text">Loading incomes...</div>
          ) : incomes.length === 0 ? (
            <div className="empty-state">No income records yet</div>
          ) : (
            renderTransactionList(incomes, 'income')
          )}
        </div>

        <div className="transaction-card">
          <h3>Recent Expenses</h3>
          {loadingOutgoings ? (
            <div className="loading-text">Loading expenses...</div>
          ) : outgoings.length === 0 ? (
            <div className="empty-state">No expense records yet</div>
          ) : (
            renderTransactionList(outgoings, 'outgoing')
          )}
        </div>
      </div>

      <footer className="footer">
        Finance Dashboard &copy; {new Date().getFullYear()} | All rights reserved.
      </footer>
    </div>
  );
};

export default Dashboard;