import { useState } from 'react';
import { Dashboard } from "./pages/Dashboard";
import { Subscriptions } from "./pages/Subscriptions";
import { PaymentMethods } from "./pages/PaymentMethods";

const PAGES = {
  "Dashboard": Dashboard,
  "Subscriptions": Subscriptions,
  "Payment Methods": PaymentMethods
};

const PortalNavigation = ({ currentPage, setPage }) => {
  return (
    <nav>
      {Object.keys(PAGES).map(page => {
        return <PortalNavigationPage key={page} page={page} setPage={setPage} isCurrent={page === currentPage} />;
      })}
    </nav>
  );
};

const PortalNavigationPage = ({ page, setPage, isCurrent }) => {
  if(isCurrent) {
    return <span>{page}</span>;
  }

  return (
    <a href="#" onClick={() => setPage(page)}>{page}</a>
  );
};

const PortalContent = ({ submarine, currentPage }) => {
  const PageComponent = PAGES[currentPage];
  return <PageComponent submarine={submarine} />;
};

const Portal = ({ submarine }) => {
  const [currentPage, setPage] = useState('Dashboard');

  return (
    <div>
      <header>
        <h1>Submarine.js</h1>
      </header>
      <PortalNavigation currentPage={currentPage} setPage={setPage} />
      <PortalContent submarine={submarine} currentPage={currentPage} />
    </div>
  );
};

export default Portal;
