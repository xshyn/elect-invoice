import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './store/app';
import Layout from './components/Layout';
import Home from './pages/Home';
import InvoiceList from './pages/InvoiceList';
import InvoiceEditor from './pages/InvoiceEditor';
import InvoiceView from './pages/InvoiceView';
import Settings from './pages/Settings';

/** HashRouter عمداً انتخاب شده تا روی GitHub Pages (هاست纯استاتیک
 *  بدون rewrite سمت سرور) همه مسیرها کار کنند.
 */
export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/:id" element={<InvoiceView />} />
            <Route path="/new" element={<InvoiceEditor mode="new" />} />
            <Route path="/edit/:id" element={<InvoiceEditor mode="edit" />} />
            <Route path="/clone/:id" element={<InvoiceEditor mode="clone" />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
