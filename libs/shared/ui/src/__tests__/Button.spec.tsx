import { render, screen } from './test-utils';
import { Button } from '../ui/Button';

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(<Button className="custom-class">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button');
    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Click
      </Button>
    );
    const button = screen.getByRole('button');
    button.click();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with loading state', () => {
    render(<Button isLoading>Loading...</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('supports fullWidth prop', () => {
    const { container } = render(<Button fullWidth>Full Width</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveStyle('width: 100%');
  });

  describe('variants', () => {
    ['primary', 'secondary', 'danger', 'success', 'ghost'].forEach(
      (variant) => {
        it(`renders ${variant} variant`, () => {
          render(<Button variant={variant as any}>{variant}</Button>);
          expect(screen.getByRole('button')).toBeInTheDocument();
        });
      }
    );
  });

  describe('sizes', () => {
    ['sm', 'md', 'lg'].forEach((size) => {
      it(`renders ${size} size`, () => {
        render(<Button size={size as any}>{size}</Button>);
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });
  });
});
