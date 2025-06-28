// File: frontend/src/pages/NotFoundPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-carbon-gray-100 text-center p-8">
      <div>
        <h1 className="text-6xl font-bold mb-4 text-carbon-gray-100 dark:text-white">404</h1>
        <p className="text-xl mb-6 text-carbon-gray-70 dark:text-carbon-gray-30">
          Oops! The page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="text-lg font-medium text-carbon-blue-60 hover:text-carbon-blue-40 dark:text-carbon-blue-40 transition-colors"
        >
          Go back to homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
