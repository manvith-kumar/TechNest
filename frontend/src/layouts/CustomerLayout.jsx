import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CompareBar from '../components/layout/CompareBar';
import { useCompare } from '../context/CompareContext';

export default function CustomerLayout() {
  const { items } = useCompare();
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <Navbar />
      <main id="main" className={`flex-1 ${items.length ? 'pb-20' : ''}`}><Outlet /></main>
      <Footer />
      <CompareBar />
    </div>
  );
}
