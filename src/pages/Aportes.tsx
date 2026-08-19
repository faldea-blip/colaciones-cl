// src/pages/Aportes.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, CreditCard, Copy, Check, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

type PaymentGateway = 'webpay' | 'mercadopago' | 'fintoc';

export const Aportes: React.FC = () => {
  const location = useLocation();
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [activeGateway, setActiveGateway] = useState<PaymentGateway | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'loading' | 'success'>('idle');
  const [copied, setCopied] = useState(false);

  // Load selected amount from router state redirect (e.g. TipJarModal)
  useEffect(() => {
    if (location.state && (location.state as any).amount) {
      setAmount((location.state as any).amount);
    }
  }, [location.state]);

  const handlePresetSelect = (value: number) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    const parsed = Number(e.target.value);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const startCheckoutSimulation = (gateway: PaymentGateway) => {
    setActiveGateway(gateway);
    setCheckoutStep('loading');

    // Simulate payment portal loading & approval
    setTimeout(() => {
      setCheckoutStep('success');
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#E05A47', '#4CAF50', '#009688']
      });
    }, 2500);
  };

  const handleCopyDetails = () => {
    const detailsText = `Banco de Chile\nCuenta Corriente\nNº Cuenta: 987-654-321-00\nRUT: 76.543.210-K\nCorreo: aportes@aldeauno.cl`;
    navigator.clipboard.writeText(detailsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetCheckout = () => {
    setActiveGateway(null);
    setCheckoutStep('idle');
  };

  const formatCLP = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="app-content" style={{ gap: '20px' }}>
      
      {/* Top Banner */}
      <div style={{ textAlign: 'center', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(224, 90, 71, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)'
        }}>
          <Heart size={32} style={{ fill: 'var(--primary)' }} />
        </div>
        <h2 className="section-title">Aporte Voluntario</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '300px', lineHeight: '1.4' }}>
          Mantén <strong>colaciones.cl</strong> activo y libre de comisiones para las cocineras de tu barrio.
        </p>
      </div>

      {checkoutStep === 'idle' ? (
        <>
          {/* Form Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>1. Elige el monto</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[300, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`tip-option ${amount === preset && !customAmount ? 'selected' : ''}`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  {formatCLP(preset)}
                </button>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="custom-amount">
                U otro monto en pesos ($)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>$</span>
                <input
                  id="custom-amount"
                  type="number"
                  placeholder="Ej: 2000"
                  className="form-input"
                  style={{ paddingLeft: '28px' }}
                  value={customAmount}
                  onChange={handleCustomChange}
                />
              </div>
            </div>
          </div>

          {/* Payment Gateways Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={18} /> 2. Pagar en línea seguro
            </h3>
            
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '4px' }}>
              Selecciona tu pasarela preferida para pagar con tarjetas de débito/crédito o transferencia directa.
            </p>

            <button
              onClick={() => startCheckoutSimulation('webpay')}
              style={{
                backgroundColor: '#EB1C24',
                color: '#fff',
                fontWeight: 700,
                border: 'none',
                padding: '12px',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'var(--transition)'
              }}
              onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
              onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
            >
              Transbank Webpay
            </button>

            <button
              onClick={() => startCheckoutSimulation('mercadopago')}
              style={{
                backgroundColor: '#00A9E0',
                color: '#fff',
                fontWeight: 700,
                border: 'none',
                padding: '12px',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'var(--transition)'
              }}
              onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
              onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
            >
              Mercado Pago
            </button>

            <button
              onClick={() => startCheckoutSimulation('fintoc')}
              style={{
                backgroundColor: '#5F5FFF',
                color: '#fff',
                fontWeight: 700,
                border: 'none',
                padding: '12px',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'var(--transition)'
              }}
              onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
              onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
            >
              Fintoc (Banco Directo)
            </button>
          </div>

          {/* Wire details Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>O transferencia directa</h3>
            
            <div style={{
              backgroundColor: 'var(--bg-app)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div><strong>Destinatario:</strong> aldeaUno SPA</div>
              <div><strong>Banco:</strong> Banco de Chile</div>
              <div><strong>Tipo de Cuenta:</strong> Cuenta Corriente</div>
              <div><strong>Número:</strong> 987-654-321-00</div>
              <div><strong>RUT:</strong> 76.543.210-K</div>
              <div><strong>Correo:</strong> aportes@aldeauno.cl</div>
            </div>

            <button
              onClick={handleCopyDetails}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '10px' }}
            >
              {copied ? (
                <>
                  <Check size={14} style={{ color: 'var(--success)' }} />
                  ¡Datos Copiados!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copiar Datos de Transferencia
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        /* SIMULATOR MODAL */
        <div className="card" style={{
          padding: '30px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          minHeight: '260px',
          textAlign: 'center'
        }}>
          {checkoutStep === 'loading' ? (
            <>
              {/* Spinner */}
              <div className="gateway-spinner" />
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                Conectando con{' '}
                {activeGateway === 'webpay'
                  ? 'Transbank Webpay'
                  : activeGateway === 'mercadopago'
                  ? 'Mercado Pago'
                  : 'Fintoc'}
                ...
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Cargando pasarela bancaria segura para {formatCLP(amount)}
              </p>
            </>
          ) : (
            <>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={30} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>¡Aporte Recibido Exitosamente!</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.4', maxWidth: '300px' }}>
                Muchas gracias por tu aporte de <strong>{formatCLP(amount)}</strong> a <strong>aldeaUno</strong>. Con esto mantendremos las colaciones locales sin intermediarios.
              </p>
              <button 
                onClick={resetCheckout} 
                className="btn btn-primary"
                style={{ width: 'auto', padding: '10px 20px', marginTop: '8px' }}
              >
                Volver a aportes
              </button>
            </>
          )}

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .gateway-spinner {
              border: 4px solid var(--border);
              border-top: 4px solid var(--primary);
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
            }
          `}</style>
        </div>
      )}

    </div>
  );
};
