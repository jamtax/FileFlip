import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold">
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            FlipFile
          </Link>
        </div>
        <ul className="flex space-x-4">
          <li>
            <Link 
              to="/" 
              className="text-gray-600 hover:text-blue-600 transition duration-300"
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              to="/convert" 
              className="text-gray-600 hover:text-blue-600 transition duration-300"
            >
              Convert
            </Link>
          </li>
          <li>
            <Link 
              to="/about" 
              className="text-gray-600 hover:text-blue-600 transition duration-300"
            >
              About
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;