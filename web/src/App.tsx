import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';

import FiltersModal from './components/FiltersModal';
import Layout from './components/Layout';
import NotificationsModal from './components/NotificationsModal';
import ListView from './pages/ListView';
import MapView from './pages/MapView';
import QuakeDetail from './pages/QuakeDetail';

const App = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <Layout
      onOpenFilters={() => setFiltersOpen(true)}
      onOpenNotifications={() => setNotificationsOpen(true)}
    >
      <Routes>
        <Route path="/" element={<ListView />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/quake/:id" element={<QuakeDetail />} />
      </Routes>

      <FiltersModal open={filtersOpen} onClose={() => setFiltersOpen(false)} />
      <NotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </Layout>
  );
};

export default App;
