import {Link} from 'react-router';
import {usePopup} from '~/lib/usePopup';

export function PopupFooter() {
  const {popup} = usePopup();
  return (
    <footer className="popup-footer">
      <span>{popup.name}</span>
      <nav aria-label="Store policies">
        <Link to="/policies/shipping-policy">Shipping</Link>
        <Link to="/policies/refund-policy">Returns</Link>
        <Link to="/policies/privacy-policy">Privacy</Link>
        <Link to="/policies/terms-of-service">Terms</Link>
      </nav>
    </footer>
  );
}
