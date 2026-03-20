import React from 'react';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../design-system/design-tokens';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  icon?: React.ReactNode;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ placeholder, value, onChange, onSubmit, icon }, ref) => {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: Spacing[4],
              top: '50%',
              transform: 'translateY(-50%)',
              color: Colors.gray400,
              fontSize: '20px',
            }}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onSubmit?.(value || '');
            }
          }}
          style={{
            width: '100%',
            padding: `${Spacing[3]} ${Spacing[4]} ${Spacing[3]} ${icon ? Spacing[12] : Spacing[4]}`,
            borderRadius: BorderRadius.xl,
            border: `2px solid ${Colors.gray200}`,
            fontSize: Typography.fontSize.base,
            fontFamily: Typography.fontFamily.sans,
            transition: 'all 200ms ease-in-out',
            boxShadow: Shadows.sm,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = Colors.primary;
            e.currentTarget.style.boxShadow = Shadows.md;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = Colors.gray200;
            e.currentTarget.style.boxShadow = Shadows.sm;
          }}
        />
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

interface TripSearchFormProps {
  onSearch?: (from: string, to: string, date: string) => void;
  loading?: boolean;
}

export const TripSearchForm: React.FC<TripSearchFormProps> = ({ onSearch, loading }) => {
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [date, setDate] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (from && to && date) {
      onSearch?.(from, to, date);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: Spacing[4],
        padding: Spacing[6],
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        boxShadow: Shadows.lg,
        width: '100%',
      }}
    >
      <div>
        <label style={{ display: 'block', marginBottom: Spacing[2], fontWeight: 600, color: Colors.gray700 }}>
          ¿Desde dónde?
        </label>
        <input
          type="text"
          placeholder="Ciudad de origen"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={{
            width: '100%',
            padding: Spacing[3],
            borderRadius: BorderRadius.lg,
            border: `1px solid ${Colors.gray200}`,
            fontSize: Typography.fontSize.base,
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: Spacing[2], fontWeight: 600, color: Colors.gray700 }}>
          ¿Hacia dónde?
        </label>
        <input
          type="text"
          placeholder="Ciudad destino"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={{
            width: '100%',
            padding: Spacing[3],
            borderRadius: BorderRadius.lg,
            border: `1px solid ${Colors.gray200}`,
            fontSize: Typography.fontSize.base,
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: Spacing[2], fontWeight: 600, color: Colors.gray700 }}>
          Fecha
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            width: '100%',
            padding: Spacing[3],
            borderRadius: BorderRadius.lg,
            border: `1px solid ${Colors.gray200}`,
            fontSize: Typography.fontSize.base,
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <button
          type="submit"
          disabled={loading || !from || !to || !date}
          style={{
            width: '100%',
            padding: Spacing[3],
            backgroundColor: Colors.primary,
            color: Colors.white,
            border: 'none',
            borderRadius: BorderRadius.lg,
            fontSize: Typography.fontSize.base,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !from || !to || !date ? 0.6 : 1,
            transition: 'all 200ms ease-in-out',
          }}
          onMouseEnter={(e) => {
            if (!loading && from && to && date) {
              e.currentTarget.style.backgroundColor = Colors.primaryLight;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = Colors.primary;
          }}
        >
          {loading ? 'Buscando...' : 'Buscar Viaje'}
        </button>
      </div>
    </form>
  );
};

TripSearchForm.displayName = 'TripSearchForm';
