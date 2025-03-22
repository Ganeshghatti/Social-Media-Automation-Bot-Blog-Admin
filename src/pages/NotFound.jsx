import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-6xl font-bold text-pink mb-4">404</h1>
      <p className="text-2xl mb-8 text-text">Page not found</p>
      <Link to="/dashboard" className="btn-primary">
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound; 