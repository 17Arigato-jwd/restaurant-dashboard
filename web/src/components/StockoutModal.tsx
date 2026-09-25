'use client';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './ui/button';

interface StockoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  name: string;
  isAvailable: boolean;
}

export function StockoutModal({ isOpen, onClose }: StockoutModalProps) {
  const [items, setItems] = useState<MenuItem[]>([
    { id: '1', name: 'Paneer Butter Masala', isAvailable: true },
    { id: '2', name: 'Garlic Naan', isAvailable: true },
    { id: '3', name: 'Chicken Tikka', isAvailable: false },
    { id: '4', name: 'Dal Makhani', isAvailable: true },
  ]);

  const [platforms, setPlatforms] = useState({
    dineIn: true,
    swiggy: true,
    zomato: true,
    ondc: true,
  });

  const toggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
    ));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Multi-Platform Stockout Controller"
      description="Quickly mark items as sold out across selected platforms."
      className="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="rounded-md border p-4 space-y-3 bg-muted/30">
          <h3 className="font-medium text-sm">Apply Changes To:</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(platforms).map(([key, value]) => (
              <label key={key} className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => setPlatforms({ ...platforms, [key]: !value })}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border rounded-md divide-y max-h-[40vh] overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4">
              <span className={`font-medium ${!item.isAvailable ? 'text-muted-foreground line-through' : ''}`}>
                {item.name}
              </span>
              <Button
                variant={item.isAvailable ? "destructive" : "default"}
                size="sm"
                onClick={() => toggleItem(item.id)}
              >
                {item.isAvailable ? "Mark Sold Out" : "Mark Available"}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}
