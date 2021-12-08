export const RadioWrapperIcon = ({ icon, label }) => {
  return (
    <li class={`payment-icon payment-icon--${icon}`} data-payment-icon={icon} aria-current="false">
      <span class="visually-hidden">
          {label}
      </span>
    </li>
  );
};
