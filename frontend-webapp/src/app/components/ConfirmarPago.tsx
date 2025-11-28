import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_...'); // Tu clave pública de Stripe

const ConfirmarPagoForm = ({ clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js no ha cargado aún
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
        // billing_details: { name: 'Jenny Rosen' },
      }
    });

    if (error) {
      console.error('Error en el pago:', error.message);
      alert('Error al procesar el pago: ' + error.message);
    } else if (paymentIntent.status === 'succeeded') {
      console.log('Pago exitoso:', paymentIntent.id);
      alert('Pago confirmado exitosamente.');
      // Aquí puedes llamar a un endpoint para confirmar el pago en tu backend
      // fetch('/api/payment/confirm', { method: 'POST', body: JSON.stringify({ transactionId: paymentIntent.id }) })
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>Pagar</button>
    </form>
  );
};

const ConfirmarPago = ({ clientSecret }) => {
  return (
    <Elements stripe={stripePromise}>
      <ConfirmarPagoForm clientSecret={clientSecret} />
    </Elements>
  );
};

export default ConfirmarPago;