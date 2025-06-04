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

  const fetchIncomes = useCallback(async () => {
    setLoadingIncomes(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/incomes/${profileId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setIncomes(data);
    } catch (err) {
      console.error('Failed to fetch incomes:', err);
      setError('Failed to load incomes. Please try again.');
    }
    setLoadingIncomes(false);
  }, [profileId, apiBaseUrl]);

  const fetchOutgoings = useCallback(async () => {
    setLoadingOutgoings(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/outgoings/${profileId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOutgoings(data);
    } catch (err) {
      console.error('Failed to fetch outgoings:', err);
      setError('Failed to load outgoings. Please try again.');
    }
    setLoadingOutgoings(false);
  }, [profileId, apiBaseUrl]);

  useEffect(() => {
    if (profileId) {
      fetchIncomes();
      fetchOutgoings();
    }
  }, [profileId, fetchIncomes, fetchOutgoings]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!description || !amount || !date) {
      setError('All fields are required.');
      return;
    }

    const endpoint = type === 'income' ? 'incomes' : 'outgoings';
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile_id: profileId, description, amount: numericAmount, date }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setDescription('');
      setAmount('');
      if (type === 'income') {
        fetchIncomes();
      } else {
        fetchOutgoings();
      }
    } catch (err: unknown) {
      console.error('Error in Dashboard handleSubmit:', err);
      let errorMessage = 'An unexpected error occurred.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleDelete = async (transactionId: number, transactionType: 'income' | 'outgoing') => {
    setError(null);
    const endpoint = transactionType === 'income' ? 'incomes' : 'outgoings';
    try {
      const response = await fetch(`${apiBaseUrl}/${endpoint}/${transactionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      if (transactionType === 'income') {
        fetchIncomes();
      } else {
        fetchOutgoings();
      }
    } catch (err: unknown) {
      console.error(`Error deleting ${transactionType}:`, err);
      let errorMessage = `Failed to delete ${transactionType}.`;
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalOutgoing = outgoings.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalOutgoing;

  const aggregateByMonth = (transactions: Transaction[]) => {
    const result: { [month: string]: number } = {};
    transactions.forEach(({ amount, date }) => {
      const month = new Date(date).toLocaleString('default', { month: 'short', year: 'numeric' });
      result[month] = (result[month] || 0) + amount;
    });
    return result;
  };

  const incomeByMonth = aggregateByMonth(incomes);
  const expenseByMonth = aggregateByMonth(outgoings);
  const months = Array.from(new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])).sort();
  const chartData = months.map(month => ({
    month,
    Income: incomeByMonth[month] || 0,
    Expense: expenseByMonth[month] || 0
  }));

  return (
    <div className="dashboard-container">
      {error && <div className="error-message">{error}</div>}

      <div className="form-card">
        <h3>Add New Transaction</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value as 'income' | 'outgoing')}>
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

      <div className="transactions-grid">
        <div className="transaction-card">
          <h3>Recent Income</h3>
          {loadingIncomes ? (
            <div className="loading-text">Loading incomes...</div>
          ) : incomes.length === 0 ? (
            <div className="empty-state">No income records yet</div>
          ) : (
            <ul className="transaction-list">
              {incomes.map((item) => (
                <li key={item.id} className="transaction-item">
                  <div className="transaction-info">
                    <div className="transaction-description">{item.description}</div>
                    <div className="transaction-details">
                      €{item.amount.toFixed(2)} • {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id, 'income')}
                    className="delete-btn"
                    title="Delete transaction"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="transaction-card">
          <h3>Recent Expenses</h3>
          {loadingOutgoings ? (
            <div className="loading-text">Loading expenses...</div>
          ) : outgoings.length === 0 ? (
            <div className="empty-state">No expense records yet</div>
          ) : (
            <ul className="transaction-list">
              {outgoings.map((item) => (
                <li key={item.id} className="transaction-item">
                  <div className="transaction-info">
                    <div className="transaction-description">{item.description}</div>
                    <div className="transaction-details">
                      €{item.amount.toFixed(2)} • {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id, 'outgoing')}
                    className="delete-btn"
                    title="Delete transaction"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="1 1" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Income" fill="#10b981" />
            <Bar dataKey="Expense" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <footer className="footer">
        Finance Dashboard &copy; {new Date().getFullYear()} | All rights reserved.
      </footer>
    </div>
  );
};

export default Dashboard;