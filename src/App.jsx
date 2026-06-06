import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  Banknote,
  Bell,
  Download,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Plus,
  ReceiptText,
  RefreshCw,
  Target,
  Trash2,
  Upload,
  WalletCards,
} from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const money = (value, currency = 'AUD') =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(Number(value) || 0);
const pct = (value) => `${Math.max(0, Math.min(100, Number(value) || 0)).toFixed(0)}%`;
const daysUntil = (date) => Math.ceil((new Date(date) - new Date(today())) / 86400000);

function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored));
    } catch {
      setValue(fallback);
    }
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Local storage can be disabled in private browser contexts.
    }
  }, [key, value]);

  return [value, setValue];
}

const starter = {
  settings: { currency: 'AUD', bufferTarget: 1200 },
  income: [
    { id: uid(), area: 'Main income', source: 'Weekly pay', amount: 1250, frequency: 'weekly', nextDate: addDays(4) },
    { id: uid(), area: 'Side income', source: 'Weekend work', amount: 220, frequency: 'fortnightly', nextDate: addDays(9) },
    { id: uid(), area: 'Other income', source: 'Marketplace sales', amount: 90, frequency: 'monthly', nextDate: addDays(16) },
  ],
  bills: [
    { id: uid(), name: 'Rent', category: 'Housing', amount: 450, dueDate: addDays(3), frequency: 'weekly', paid: false },
    { id: uid(), name: 'Electricity', category: 'Utilities', amount: 180, dueDate: addDays(12), frequency: 'quarterly', paid: false },
    { id: uid(), name: 'Phone', category: 'Phone', amount: 65, dueDate: addDays(7), frequency: 'monthly', paid: true },
  ],
  debts: [
    { id: uid(), name: 'Credit card', balance: 3200, rate: 19.9, payment: 180, priority: 'avalanche' },
    { id: uid(), name: 'Car loan', balance: 9200, rate: 8.2, payment: 360, priority: 'snowball' },
  ],
  savings: [
    { id: uid(), name: 'Emergency buffer', target: 3000, saved: 900, contribution: 150 },
    { id: uid(), name: 'Holiday', target: 1800, saved: 420, contribution: 80 },
  ],
};

export default function App() {
  const [settings, setSettings] = useLocalStorage('moneytalks_settings_v2', starter.settings);
  const [income, setIncome] = useLocalStorage('moneytalks_income_v2', starter.income);
  const [bills, setBills] = useLocalStorage('moneytalks_bills_v2', starter.bills);
  const [debts, setDebts] = useLocalStorage('moneytalks_debts_v2', starter.debts);
  const [savings, setSavings] = useLocalStorage('moneytalks_savings_v2', starter.savings);
  const [view, setView] = useState('overview');

  const totals = useMemo(() => {
    const incomeTotal = income.reduce((sum, item) => sum + monthlyAmount(item.amount, item.frequency), 0);
    const billTotal = bills.reduce((sum, item) => sum + monthlyAmount(item.amount, item.frequency), 0);
    const debtTotal = debts.reduce((sum, item) => sum + Number(item.payment || 0), 0);
    const savingsTotal = savings.reduce((sum, item) => sum + Number(item.contribution || 0), 0);
    const savedTotal = savings.reduce((sum, item) => sum + Number(item.saved || 0), 0);
    const savingTarget = savings.reduce((sum, item) => sum + Number(item.target || 0), 0);
    const debtBalance = debts.reduce((sum, item) => sum + Number(item.balance || 0), 0);
    const left = incomeTotal - billTotal - debtTotal - savingsTotal;
    return { incomeTotal, billTotal, debtTotal, savingsTotal, savedTotal, savingTarget, debtBalance, left };
  }, [income, bills, debts, savings]);

  function exportData() {
    downloadFile('moneytalks-budget-backup.json', JSON.stringify({ settings, income, bills, debts, savings }, null, 2));
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        if (data.settings) setSettings(data.settings);
        if (Array.isArray(data.income)) setIncome(data.income);
        if (Array.isArray(data.bills)) setBills(data.bills);
        if (Array.isArray(data.debts)) setDebts(data.debts);
        if (Array.isArray(data.savings)) setSavings(data.savings);
      } catch {
        alert('That backup file could not be imported.');
      }
    };
    reader.readAsText(file);
  }

  function resetDemo() {
    if (!confirm('Replace the current data with the starter budget?')) return;
    setSettings(starter.settings);
    setIncome(starter.income);
    setBills(starter.bills);
    setDebts(starter.debts);
    setSavings(starter.savings);
  }

  const chartRows = [
    { label: 'Bills', value: totals.billTotal, color: 'var(--orange)' },
    { label: 'Debt', value: totals.debtTotal, color: 'var(--red)' },
    { label: 'Savings', value: totals.savingsTotal, color: 'var(--green)' },
    { label: 'Spare', value: Math.max(0, totals.left), color: 'var(--blue)' },
  ];

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo"><WalletCards size={26} /></div>
          <div>
            <p>MoneyTalks</p>
            <h1>Personal Budget Hub</h1>
          </div>
        </div>
        <div className="top-actions">
          <button className="icon-action" type="button" onClick={exportData} aria-label="Download backup"><Download size={18} /></button>
          <label className="icon-action" aria-label="Upload backup">
            <Upload size={18} />
            <input hidden type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          </label>
          <button className="icon-action" type="button" onClick={resetDemo} aria-label="Reset demo data"><RefreshCw size={18} /></button>
        </div>
      </header>

      <nav className="nav" aria-label="Budget sections">
        {[
          ['overview', 'Overview', LayoutDashboard],
          ['income', 'Income', Banknote],
          ['bills', 'Bills', ReceiptText],
          ['debts', 'Debt', Landmark],
          ['savings', 'Savings', PiggyBank],
        ].map(([id, label, Icon]) => (
          <button key={id} className={view === id ? 'active' : ''} type="button" onClick={() => setView(id)}>
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <section className="hero-panel">
        <div>
          <p className="eyebrow">Monthly plan</p>
          <h2>{money(totals.left, settings.currency)} left to allocate</h2>
          <p>Incoming money is split into three clear areas, then matched against bills, debt payments, and savings goals.</p>
        </div>
        <div className="hero-ring" style={{ '--progress': pct((totals.billTotal + totals.debtTotal + totals.savingsTotal) / Math.max(1, totals.incomeTotal) * 100) }}>
          <strong>{pct((totals.billTotal + totals.debtTotal + totals.savingsTotal) / Math.max(1, totals.incomeTotal) * 100)}</strong>
          <span>allocated</span>
        </div>
      </section>

      <section className="stats-grid">
        <Stat icon={ArrowDownToLine} label="Income" value={money(totals.incomeTotal, settings.currency)} />
        <Stat icon={Bell} label="Bills" value={money(totals.billTotal, settings.currency)} />
        <Stat icon={Landmark} label="Debt balance" value={money(totals.debtBalance, settings.currency)} />
        <Stat icon={Target} label="Saved" value={`${pct((totals.savedTotal / Math.max(1, totals.savingTarget)) * 100)} funded`} />
      </section>

      {view === 'overview' && (
        <Overview
          settings={settings}
          totals={totals}
          chartRows={chartRows}
          income={income}
          bills={bills}
          debts={debts}
          savings={savings}
          setView={setView}
        />
      )}
      {view === 'income' && <IncomePage income={income} setIncome={setIncome} settings={settings} />}
      {view === 'bills' && <BillsPage bills={bills} setBills={setBills} settings={settings} />}
      {view === 'debts' && <DebtPage debts={debts} setDebts={setDebts} settings={settings} />}
      {view === 'savings' && <SavingsPage savings={savings} setSavings={setSavings} settings={settings} />}
    </main>
  );
}

function Overview({ settings, totals, chartRows, income, bills, debts, savings, setView }) {
  const dueSoon = bills
    .filter((bill) => !bill.paid)
    .map((bill) => ({ ...bill, days: daysUntil(bill.dueDate) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);
  const debtFocus = [...debts].sort((a, b) => Number(b.rate || 0) - Number(a.rate || 0))[0];
  const savingFocus = [...savings].sort((a, b) => progress(a) - progress(b))[0];

  return (
    <section className="overview-grid">
      <Panel title="Money map" action={<button onClick={() => setView('income')}>Edit income</button>}>
        <Donut rows={chartRows} total={totals.incomeTotal} currency={settings.currency} />
      </Panel>
      <Panel title="Cash flow chart">
        <BarChart rows={[
          { label: 'Income', value: totals.incomeTotal, color: 'var(--teal)' },
          ...chartRows,
        ]} currency={settings.currency} />
      </Panel>
      <Panel title="Income split">
        <CompactList items={income} empty="Add your first income stream." render={(item) => (
          <>
            <strong>{item.area}</strong>
            <span>{item.source} · {money(monthlyAmount(item.amount, item.frequency), settings.currency)} monthly</span>
          </>
        )} />
      </Panel>
      <Panel title="Bill organiser" action={<button onClick={() => setView('bills')}>Manage bills</button>}>
        <CompactList items={dueSoon} empty="No bills due soon." render={(item) => (
          <>
            <strong>{item.name}</strong>
            <span>{money(item.amount, settings.currency)} · {item.days < 0 ? `${Math.abs(item.days)} days overdue` : `due in ${item.days} days`}</span>
          </>
        )} />
      </Panel>
      <Panel title="Debt focus" action={<button onClick={() => setView('debts')}>Track debt</button>}>
        {debtFocus ? <FocusCard title={debtFocus.name} value={money(debtFocus.balance, settings.currency)} detail={`${debtFocus.rate || 0}% interest · ${money(debtFocus.payment, settings.currency)} payment`} /> : <EmptyText text="Add a debt to track payoff progress." />}
      </Panel>
      <Panel title="Savings focus" action={<button onClick={() => setView('savings')}>Set goals</button>}>
        {savingFocus ? <FocusCard title={savingFocus.name} value={pct(progress(savingFocus))} detail={`${money(savingFocus.saved, settings.currency)} of ${money(savingFocus.target, settings.currency)}`} /> : <EmptyText text="Add a savings goal to start building momentum." />}
      </Panel>
    </section>
  );
}

function IncomePage({ income, setIncome, settings }) {
  const grouped = ['Main income', 'Side income', 'Other income'];
  return (
    <section className="page-stack">
      <QuickAdd title="Add income stream" fields={[
        ['area', 'select', grouped],
        ['source', 'text'],
        ['amount', 'number'],
        ['frequency', 'select', ['weekly', 'fortnightly', 'monthly', 'once']],
        ['nextDate', 'date'],
      ]} onAdd={(row) => setIncome((items) => [{ id: uid(), ...row, amount: Number(row.amount || 0) }, ...items])} />
      <div className="three-column">
        {grouped.map((area) => (
          <Panel key={area} title={area}>
            <EditableList
              rows={income.filter((item) => item.area === area)}
              fields={['source', 'amount', 'frequency', 'nextDate']}
              currency={settings.currency}
              onUpdate={(id, field, value) => setIncome((items) => update(items, id, field, field === 'amount' ? Number(value) : value))}
              onDelete={(id) => setIncome((items) => items.filter((item) => item.id !== id))}
            />
          </Panel>
        ))}
      </div>
    </section>
  );
}

function BillsPage({ bills, setBills, settings }) {
  return (
    <section className="page-stack">
      <QuickAdd title="Add bill" fields={[
        ['name', 'text'],
        ['category', 'select', ['Housing', 'Utilities', 'Phone', 'Insurance', 'Transport', 'Subscriptions', 'Other']],
        ['amount', 'number'],
        ['dueDate', 'date'],
        ['frequency', 'select', ['weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly', 'once']],
      ]} onAdd={(row) => setBills((items) => [{ id: uid(), paid: false, ...row, amount: Number(row.amount || 0) }, ...items])} />
      <Panel title="Bill organiser">
        <EditableList
          rows={[...bills].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))}
          fields={['name', 'category', 'amount', 'dueDate', 'frequency', 'paid']}
          currency={settings.currency}
          onUpdate={(id, field, value) => setBills((items) => update(items, id, field, field === 'amount' ? Number(value) : value))}
          onDelete={(id) => setBills((items) => items.filter((item) => item.id !== id))}
        />
      </Panel>
    </section>
  );
}

function DebtPage({ debts, setDebts, settings }) {
  return (
    <section className="page-stack">
      <QuickAdd title="Add debt" fields={[
        ['name', 'text'],
        ['balance', 'number'],
        ['rate', 'number'],
        ['payment', 'number'],
        ['priority', 'select', ['avalanche', 'snowball']],
      ]} onAdd={(row) => setDebts((items) => [{ id: uid(), ...row, balance: Number(row.balance || 0), rate: Number(row.rate || 0), payment: Number(row.payment || 0) }, ...items])} />
      <Panel title="Debt tracker">
        <DebtCards debts={debts} setDebts={setDebts} currency={settings.currency} />
      </Panel>
    </section>
  );
}

function SavingsPage({ savings, setSavings, settings }) {
  return (
    <section className="page-stack">
      <QuickAdd title="Add savings goal" fields={[
        ['name', 'text'],
        ['target', 'number'],
        ['saved', 'number'],
        ['contribution', 'number'],
      ]} onAdd={(row) => setSavings((items) => [{ id: uid(), ...row, target: Number(row.target || 0), saved: Number(row.saved || 0), contribution: Number(row.contribution || 0) }, ...items])} />
      <Panel title="Savings goals">
        <SavingCards savings={savings} setSavings={setSavings} currency={settings.currency} />
      </Panel>
    </section>
  );
}

function QuickAdd({ title, fields, onAdd }) {
  const initial = Object.fromEntries(fields.map(([name, type, options]) => [name, type === 'select' ? options[0] : type === 'date' ? today() : '']));
  const [form, setForm] = useState(initial);

  function submit(event) {
    event.preventDefault();
    onAdd(form);
    setForm(initial);
  }

  return (
    <form className="quick-add" onSubmit={submit}>
      <h2><Plus size={18} />{title}</h2>
      <div className="quick-fields">
        {fields.map(([name, type, options]) => (
          <label key={name}>
            {labelize(name)}
            {type === 'select' ? (
              <select value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}>
                {options.map((option) => <option key={option}>{option}</option>)}
              </select>
            ) : (
              <input required type={type} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
            )}
          </label>
        ))}
      </div>
      <button className="primary-button" type="submit"><Plus size={17} />Add</button>
    </form>
  );
}

function EditableList({ rows, fields, currency, onUpdate, onDelete }) {
  if (!rows.length) return <EmptyText text="Nothing here yet." />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{fields.map((field) => <th key={field}>{labelize(field)}</th>)}<th></th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {fields.map((field) => (
                <td key={field}>
                  {field === 'paid' ? (
                    <input type="checkbox" checked={!!row[field]} onChange={(e) => onUpdate(row.id, field, e.target.checked)} />
                  ) : field === 'frequency' || field === 'priority' || field === 'category' ? (
                    <input value={row[field] || ''} onChange={(e) => onUpdate(row.id, field, e.target.value)} />
                  ) : field.toLowerCase().includes('date') ? (
                    <input type="date" value={row[field] || today()} onChange={(e) => onUpdate(row.id, field, e.target.value)} />
                  ) : (
                    <input type={['amount', 'balance', 'rate', 'payment', 'target', 'saved', 'contribution'].includes(field) ? 'number' : 'text'} value={row[field] ?? ''} onChange={(e) => onUpdate(row.id, field, e.target.value)} />
                  )}
                </td>
              ))}
              <td><button className="delete-button" type="button" onClick={() => onDelete(row.id)} aria-label="Delete row"><Trash2 size={16} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="table-note">Monthly amounts are calculated using your frequency. Currency: {currency}.</p>
    </div>
  );
}

function DebtCards({ debts, setDebts, currency }) {
  if (!debts.length) return <EmptyText text="Add debts to compare balance, interest, and payment progress." />;
  return <div className="card-grid">{debts.map((debt) => {
    const months = Number(debt.payment) > 0 ? Math.ceil(Number(debt.balance) / Number(debt.payment)) : 0;
    return (
      <article className="tracker-card" key={debt.id}>
        <div className="tracker-heading">
          <Landmark size={20} />
          <input value={debt.name} onChange={(e) => setDebts((items) => update(items, debt.id, 'name', e.target.value))} />
          <button type="button" onClick={() => setDebts((items) => items.filter((item) => item.id !== debt.id))}><Trash2 size={16} /></button>
        </div>
        <div className="tracker-values">
          <label>Balance<input type="number" value={debt.balance} onChange={(e) => setDebts((items) => update(items, debt.id, 'balance', Number(e.target.value)))} /></label>
          <label>Interest<input type="number" value={debt.rate} onChange={(e) => setDebts((items) => update(items, debt.id, 'rate', Number(e.target.value)))} /></label>
          <label>Payment<input type="number" value={debt.payment} onChange={(e) => setDebts((items) => update(items, debt.id, 'payment', Number(e.target.value)))} /></label>
        </div>
        <p>{money(debt.balance, currency)} balance · about {months || 'many'} months at this payment</p>
      </article>
    );
  })}</div>;
}

function SavingCards({ savings, setSavings, currency }) {
  if (!savings.length) return <EmptyText text="Add goals for emergency funds, holidays, deposits, or big purchases." />;
  return <div className="card-grid">{savings.map((goal) => (
    <article className="tracker-card" key={goal.id}>
      <div className="tracker-heading">
        <PiggyBank size={20} />
        <input value={goal.name} onChange={(e) => setSavings((items) => update(items, goal.id, 'name', e.target.value))} />
        <button type="button" onClick={() => setSavings((items) => items.filter((item) => item.id !== goal.id))}><Trash2 size={16} /></button>
      </div>
      <div className="progress-line"><span style={{ width: pct(progress(goal)) }} /></div>
      <div className="tracker-values">
        <label>Target<input type="number" value={goal.target} onChange={(e) => setSavings((items) => update(items, goal.id, 'target', Number(e.target.value)))} /></label>
        <label>Saved<input type="number" value={goal.saved} onChange={(e) => setSavings((items) => update(items, goal.id, 'saved', Number(e.target.value)))} /></label>
        <label>Monthly<input type="number" value={goal.contribution} onChange={(e) => setSavings((items) => update(items, goal.id, 'contribution', Number(e.target.value)))} /></label>
      </div>
      <p>{pct(progress(goal))} funded · {money(Math.max(0, goal.target - goal.saved), currency)} to go</p>
    </article>
  ))}</div>;
}

function Donut({ rows, total, currency }) {
  const gradient = rows
    .reduce((parts, row) => {
      const start = parts.cursor;
      const size = total > 0 ? (row.value / total) * 100 : 0;
      parts.segments.push(`${row.color} ${start}% ${start + size}%`);
      parts.cursor += size;
      return parts;
    }, { cursor: 0, segments: [] }).segments.join(',');
  return (
    <div className="donut-layout">
      <div className="donut" style={{ background: `conic-gradient(${gradient || 'var(--line) 0 100%'})` }}>
        <div><strong>{money(total, currency)}</strong><span>income</span></div>
      </div>
      <div className="legend">
        {rows.map((row) => (
          <div key={row.label}><i style={{ background: row.color }} />{row.label}<strong>{money(row.value, currency)}</strong></div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ rows, currency }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return <div className="bar-chart">{rows.map((row) => (
    <div className="bar-row" key={row.label}>
      <span>{row.label}</span>
      <div><i style={{ width: pct((row.value / max) * 100), background: row.color }} /></div>
      <strong>{money(row.value, currency)}</strong>
    </div>
  ))}</div>;
}

function Panel({ title, action, children }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value }) {
  return <article className="stat"><Icon size={21} /><span>{label}</span><strong>{value}</strong></article>;
}

function CompactList({ items, render, empty }) {
  if (!items.length) return <EmptyText text={empty} />;
  return <div className="compact-list">{items.map((item) => <article key={item.id}>{render(item)}</article>)}</div>;
}

function FocusCard({ title, value, detail }) {
  return <div className="focus-card"><strong>{value}</strong><h3>{title}</h3><p>{detail}</p></div>;
}

function EmptyText({ text }) {
  return <p className="empty-text">{text}</p>;
}

function monthlyAmount(amount, frequency) {
  const value = Number(amount) || 0;
  return ({ weekly: value * 52 / 12, fortnightly: value * 26 / 12, quarterly: value / 3, yearly: value / 12, once: value, monthly: value }[frequency] ?? value);
}

function progress(goal) {
  return (Number(goal.saved || 0) / Math.max(1, Number(goal.target || 0))) * 100;
}

function update(items, id, field, value) {
  return items.map((item) => (item.id === id ? { ...item, [field]: value } : item));
}

function labelize(value) {
  return String(value).replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

function downloadFile(name, text) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  link.download = name;
  link.click();
}
