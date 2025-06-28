import React from 'react';
import { useRouter } from 'next/router';

const NotFoundPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">404 - Page Not Found</h1>
      <p className="text-base mb-4">Sorry, we couldn't find the page you were looking for.</p>
      <button
        onClick={() => router.push('/')}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go Home
      </button>
    </div>
  );
};

export default NotFoundPage;
