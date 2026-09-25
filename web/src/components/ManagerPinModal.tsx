'use client';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './ui/button';

interface ManagerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionName?: string;
}

export function ManagerPinModal({ isOpen, onClose, onSuccess, actionName = "this action" }: ManagerPinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setError(false);
      onSuccess();
      setPin('');
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setPin('');
        setError(false);
        onClose();
      }}
      title="Manager Authorization Required"
      description={`Please enter your 4-digit PIN to authorize ${actionName}.`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/[^0-9]/g, ''));
              setError(false);
            }}
            placeholder="****"
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-center tracking-[1em] text-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              error ? 'border-destructive focus-visible:ring-destructive' : 'border-input'
            }`}
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-destructive font-medium text-center">
              Invalid PIN. Please try again.
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Hint: Use 1234 for testing.
          </p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pin.length !== 4}>
            Authorize
          </Button>
        </div>
      </form>
    </Modal>
  );
}
