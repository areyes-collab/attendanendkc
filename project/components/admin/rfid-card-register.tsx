'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertCircle } from 'lucide-react';
import { createDocument, getDocuments, updateDocument } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

interface RFIDCardProps {
  onRegister?: (rfidId: string) => void;
  onCancel?: () => void;
}

export function RFIDCardRegister({ onRegister, onCancel }: RFIDCardProps) {
  const { showToast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedId, setScannedId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle keyboard input for card scanning
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyPress = async (event: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Reset buffer if too much time has passed between keystrokes
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      // Only process if we're in scanning mode
      if (!isScanning) return;

      // Ignore special keys
      if (event.key === 'Shift' || event.key === 'Enter') return;

      // Add key to buffer
      buffer += event.key;

      // Process complete RFID scan (usually ends with Enter)
      if (event.key === 'Enter') {
        event.preventDefault();
        
        // Validate RFID format
        const rfidId = buffer.slice(0, -1); // Remove Enter key
        if (rfidId.length < 8) {
          setError('Invalid RFID card. Please try again.');
          buffer = '';
          return;
        }

        try {
          // Check if card already exists
          const existingCards = await getDocuments('rfid_cards', []);
          const cardExists = existingCards.some(card => card.rfid_id === rfidId);

          if (cardExists) {
            setError('This card is already registered.');
            setScannedId('');
            buffer = '';
            return;
          }

          // Create new card record
          const cardData = {
            rfid_id: rfidId,
            status: 'active',
            created_at: new Date().toISOString(),
          };

          await createDocument('rfid_cards', cardData);
          
          setScannedId(rfidId);
          setError(null);
          showToast("Card registered successfully", "success");
          
          if (onRegister) {
            onRegister(rfidId);
          }
        } catch (err) {
          console.error('Error registering card:', err);
          setError('Failed to register card. Please try again.');
        }

        buffer = '';
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [isScanning, onRegister, showToast]);

  const startScanning = () => {
    setIsScanning(true);
    setError(null);
    setScannedId('');
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Register New RFID Card
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {isScanning ? (
            <div className="text-center py-6 space-y-4">
              <div className="animate-pulse">
                <CreditCard className="h-12 w-12 mx-auto text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Scanning for RFID Card...</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Please tap the card on the reader
                </p>
              </div>
              {scannedId && (
                <div className="mt-4">
                  <Badge variant="success" className="text-lg">
                    Card ID: {scannedId}
                  </Badge>
                </div>
              )}
              <Button variant="outline" onClick={stopScanning} className="mt-4">
                Cancel
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Button onClick={startScanning}>
                Start Scanning
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}