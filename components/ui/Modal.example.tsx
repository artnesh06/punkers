'use client';

import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

/**
 * Example usage of the Modal component
 * This file demonstrates how to use the Modal component in your application
 */
export default function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg'>('md');

  return (
    <div style={{ padding: '40px' }}>
      <h2>Modal Component Examples</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <Button onClick={() => { setModalSize('sm'); setIsOpen(true); }}>
          Open Small Modal
        </Button>
        <Button onClick={() => { setModalSize('md'); setIsOpen(true); }}>
          Open Medium Modal
        </Button>
        <Button onClick={() => { setModalSize('lg'); setIsOpen(true); }}>
          Open Large Modal
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Modal"
        size={modalSize}
      >
        <div>
          <p>This is an example modal content.</p>
          <p>You can close this modal by:</p>
          <ul>
            <li>Clicking the [X] button</li>
            <li>Pressing the ESC key</li>
            <li>Clicking outside the modal</li>
          </ul>
          <p style={{ marginTop: '20px' }}>
            Current size: <strong>{modalSize}</strong>
          </p>
        </div>
      </Modal>
    </div>
  );
}
