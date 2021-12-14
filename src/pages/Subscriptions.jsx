import { useState, useEffect } from 'react';

const loadSubscriptions = (submarine, setLoading, setSubscriptions) => {
  setLoading(true);
  submarine.getSubscriptions((subscriptions) => {
    setSubscriptions(subscriptions);
    setLoading(false);
  });
};

const Subscription = ({ subscription }) => {
  return <li>{subscription.attributes.nickname} {subscription.id}</li>;
};

export const Subscriptions = ({ submarine }) => {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    loadSubscriptions(submarine, setLoading, setSubscriptions);
  }, []);

  if(loading) {
    return <span>Loading...</span>;
  }

  return (
    <ul>
      {subscriptions.map(subscription => {
        return <Subscription key={subscription.id} subscription={subscription} />;
      })}
    </ul>
  )
};
