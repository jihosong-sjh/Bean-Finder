import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { BeanDetailPage } from './pages/BeanDetailPage';
import { CategoryPage } from './pages/CategoryPage';
import { ComparePage } from './pages/ComparePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RankingPage } from './pages/RankingPage';
import { SearchPage } from './pages/SearchPage';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'search', element: <SearchPage /> },
        { path: 'beans/:beanId', element: <BeanDetailPage /> },
        { path: 'compare', element: <ComparePage /> },
        { path: 'categories/:categoryKey', element: <CategoryPage /> },
        { path: 'rankings/:rankingKey', element: <RankingPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  },
);
