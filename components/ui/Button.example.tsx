'use client';

import Button from './Button';

/**
 * Example usage of the Button component
 * This file demonstrates all button variants and sizes
 */
export default function ButtonExample() {
  return (
    <div style={{ padding: '40px', background: 'var(--bg-primary, #0a0a0a)' }}>
      <h2 style={{ color: 'var(--text-primary, #e0e0e0)', marginBottom: '30px' }}>
        Button Component Examples
      </h2>

      {/* Variants */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'var(--text-primary, #e0e0e0)', marginBottom: '20px' }}>
          Variants
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="success">Success Button</Button>
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'var(--text-primary, #e0e0e0)', marginBottom: '20px' }}>
          Sizes
        </h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button size="sm">Small Button</Button>
          <Button size="md">Medium Button</Button>
          <Button size="lg">Large Button</Button>
        </div>
      </section>

      {/* Disabled States */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'var(--text-primary, #e0e0e0)', marginBottom: '20px' }}>
          Disabled States
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="primary" disabled>
            Disabled Primary
          </Button>
          <Button variant="secondary" disabled>
            Disabled Secondary
          </Button>
          <Button variant="danger" disabled>
            Disabled Danger
          </Button>
          <Button variant="success" disabled>
            Disabled Success
          </Button>
        </div>
      </section>

      {/* Loading States */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'var(--text-primary, #e0e0e0)', marginBottom: '20px' }}>
          Loading States
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="primary" loading>
            Loading Primary
          </Button>
          <Button variant="secondary" loading>
            Loading Secondary
          </Button>
          <Button variant="danger" loading>
            Loading Danger
          </Button>
          <Button variant="success" loading>
            Loading Success
          </Button>
        </div>
      </section>

      {/* Combined Variants and Sizes */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'var(--text-primary, #e0e0e0)', marginBottom: '20px' }}>
          Combined Variants and Sizes
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="primary" size="sm">
              Small Primary
            </Button>
            <Button variant="primary" size="md">
              Medium Primary
            </Button>
            <Button variant="primary" size="lg">
              Large Primary
            </Button>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="success" size="sm">
              Small Success
            </Button>
            <Button variant="success" size="md">
              Medium Success
            </Button>
            <Button variant="success" size="lg">
              Large Success
            </Button>
          </div>
        </div>
      </section>

      {/* Interactive Example */}
      <section>
        <h3 style={{ color: 'var(--text-primary, #e0e0e0)', marginBottom: '20px' }}>
          Interactive Example
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={() => alert('Primary button clicked!')}
          >
            Click Me (Primary)
          </Button>
          <Button
            variant="success"
            onClick={() => alert('Success button clicked!')}
          >
            Click Me (Success)
          </Button>
          <Button
            variant="danger"
            onClick={() => alert('Danger button clicked!')}
          >
            Click Me (Danger)
          </Button>
        </div>
      </section>
    </div>
  );
}
