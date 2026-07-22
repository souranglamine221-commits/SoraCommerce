import { useFormatPrice } from '../hooks/useFormatPrice';

function CartItem({ item }) {
  const formatPrice = useFormatPrice();
  
  return (
    <div>
      <span>{item.name}</span>
      <span>{formatPrice(item.price * item.quantity)}</span>
    </div>
  );
}