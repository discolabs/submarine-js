import { useState, useEffect } from 'react';

const loadPaymentMethods = (submarine, setLoading, setPaymentMethods) => {
  setLoading(true);
  submarine.getPaymentMethods((paymentMethods) => {
    setPaymentMethods(paymentMethods);
    setLoading(false);
  });
};

const PaymentMethod = ({ paymentMethod }) => {
  return <li>{paymentMethod.id}</li>;
};

export const PaymentMethods = ({ submarine }) => {
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    loadPaymentMethods(submarine, setLoading, setPaymentMethods);
  }, []);

  if(loading) {
    return <span>Loading...</span>;
  }

  return (
    <ul>
      {paymentMethods.map(paymentMethod => {
        return <PaymentMethod key={paymentMethod.id} paymentMethod={paymentMethod} />;
      })}
    </ul>
  );
};
