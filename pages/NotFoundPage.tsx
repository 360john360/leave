
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg-light text-center p-6">
      <div className="bg-white p-8 sm:p-12 rounded-xl shadow-2xl border border-brand-border max-w-lg w-full">
        <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-brand-warning mb-6" />
        <h1 className="text-5xl font-extrabold text-brand-primary mb-3">404</h1>
        <h2 className="text-2xl font-semibold text-brand-text mb-3">Page Not Found</h2>
        <p className="text-brand-text-secondary mb-8">
          We're sorry, but the page you were looking for could not be found. It might have been moved, deleted, or the URL might be incorrect.
        </p>
        <Link to="/dashboard">
          <Button variant="primary" size="lg" className="w-full sm:w-auto">
            Return to Dashboard
          </Button>
        </Link>
        <p className="mt-10 text-xs text-brand-text-secondary">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
