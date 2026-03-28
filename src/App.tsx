import React, { useState, useEffect, useMemo } from 'react';
import * as OTPAuth from 'otpauth';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Shield, 
  Smartphone, 
  Clock, 
  AlertCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Account } from './types';

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newIssuer, setNewIssuer] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  // Load accounts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('auth_accounts');
    if (saved) {
      try {
        setAccounts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load accounts', e);
      }
    }
  }, []);

  // Save accounts to localStorage
  useEffect(() => {
    localStorage.setItem('auth_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Update timer and codes
  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor(Date.now() / 1000);
      setTimeLeft(30 - (seconds % 30));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newIssuer || !newAccountName || !newSecret) {
      setError('All fields are required');
      return;
    }

    try {
      // Validate secret
      const totp = new OTPAuth.TOTP({
        issuer: newIssuer,
        label: newAccountName,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: newSecret.replace(/\s/g, '').toUpperCase(),
      });
      
      // Test generation
      totp.generate();

      const newEntry: Account = {
        id: crypto.randomUUID(),
        issuer: newIssuer,
        account: newAccountName,
        secret: newSecret.replace(/\s/g, '').toUpperCase(),
        addedAt: Date.now(),
      };

      setAccounts([...accounts, newEntry]);
      setIsAdding(false);
      setNewIssuer('');
      setNewAccountName('');
      setNewSecret('');
    } catch (err) {
      setError('Invalid secret key format');
    }
  };

  const deleteAccount = (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      setAccounts(accounts.filter(a => a.id !== id));
    }
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#E5E5E5] px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#1A1A1A]" />
          <h1 className="text-lg font-semibold tracking-tight uppercase">Authenticator Pro</h1>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-2 rounded-full hover:bg-[#F5F5F5] transition-colors"
          aria-label="Add Account"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      <main className="max-w-md mx-auto p-4 pb-24">
        {/* Progress Bar */}
        <div className="mb-6 flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E5E5E5] shadow-sm">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                className="text-[#E5E5E5]"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={88}
                strokeDashoffset={88 - (timeLeft / 30) * 88}
                className="text-[#1A1A1A] transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="absolute text-[10px] font-bold">{timeLeft}</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#666666]">Next refresh in {timeLeft}s</p>
          </div>
        </div>

        {/* Account List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {accounts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 px-6 bg-white rounded-2xl border border-dashed border-[#CCCCCC]"
              >
                <Smartphone className="w-12 h-12 mx-auto mb-4 text-[#CCCCCC]" />
                <p className="text-[#666666] font-medium">No accounts added yet.</p>
                <p className="text-xs text-[#999999] mt-1">Tap the plus icon to get started.</p>
              </motion.div>
            ) : (
              (accounts as Account[]).map((account: Account) => (
                <AccountItem 
                  key={account.id} 
                  account={account} 
                  onDelete={() => deleteAccount(account.id)}
                  onCopy={(code) => copyToClipboard(code, account.id)}
                  isCopied={copiedId === account.id}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Account Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold tracking-tight">Add Account</h2>
                  <button onClick={() => setIsAdding(false)} className="p-1 hover:bg-[#F5F5F5] rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddAccount} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-1 ml-1">Issuer (e.g. Google)</label>
                    <input 
                      type="text" 
                      value={newIssuer}
                      onChange={(e) => setNewIssuer(e.target.value)}
                      className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1A1A1A] transition-all outline-none"
                      placeholder="Service Name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-1 ml-1">Account Name</label>
                    <input 
                      type="text" 
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1A1A1A] transition-all outline-none"
                      placeholder="Email or Username"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-1 ml-1">Secret Key</label>
                    <input 
                      type="text" 
                      value={newSecret}
                      onChange={(e) => setNewSecret(e.target.value)}
                      className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1A1A1A] transition-all outline-none font-mono"
                      placeholder="Enter 2FA Secret"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p className="text-xs font-medium">{error}</p>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-xl hover:bg-black active:scale-[0.98] transition-all shadow-lg shadow-black/10"
                  >
                    Save Account
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 text-center">
        <div className="max-w-md mx-auto bg-white/80 backdrop-blur-md border border-[#E5E5E5] rounded-2xl py-3 shadow-lg">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#999999]">
            Developed by <span className="text-[#1A1A1A]">arefin foysal</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

interface AccountItemProps {
  account: Account;
  onDelete: () => void;
  onCopy: (code: string) => void;
  isCopied: boolean;
}

const AccountItem: React.FC<AccountItemProps> = ({ 
  account, 
  onDelete, 
  onCopy, 
  isCopied 
}) => {
  const code = useMemo(() => {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: account.issuer,
        label: account.account,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: account.secret,
      });
      return totp.generate();
    } catch (e) {
      return 'ERROR';
    }
  }, [account.secret, Math.floor(Date.now() / 30000)]); // Re-generate every 30s

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-white rounded-2xl border border-[#E5E5E5] p-5 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#666666] mb-0.5">{account.issuer}</h3>
          <p className="text-sm font-medium text-[#999999] truncate max-w-[200px]">{account.account}</p>
        </div>
        <button 
          onClick={onDelete}
          className="p-2 text-[#CCCCCC] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {code.split('').map((digit, i) => (
            <span key={i} className="text-4xl font-black tracking-tight tabular-nums">
              {digit}
            </span>
          ))}
        </div>
        
        <button 
          onClick={() => onCopy(code)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all",
            isCopied 
              ? "bg-green-500 text-white" 
              : "bg-[#F5F5F5] text-[#1A1A1A] hover:bg-[#E5E5E5]"
          )}
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
