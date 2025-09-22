
import React from 'react';
import { Card } from '../components/ui/Card';

interface GenericScreenProps {
  title: string;
  message: string;
}

const GenericScreen: React.FC<GenericScreenProps> = ({ title, message }) => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
      <Card>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-700">{message}</h2>
          <p className="text-gray-500 mt-2">This feature is under construction.</p>
        </div>
      </Card>
    </div>
  );
};

export default GenericScreen;
