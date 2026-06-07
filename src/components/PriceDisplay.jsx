import { memo } from 'react';
import { useCurrency } from '../context/CurrencyContext';

/**
 * PriceDisplay — reusable component for displaying converted prices.
 *
 * Usage:
 *   <PriceDisplay amountOMR={2.5} />                    → converts 2.5 OMR to user's currency
 *   <PriceDisplay priceString="17 ر.ع" />               → parses string, converts, formats
 *   <PriceDisplay amountOMR={17} className="text-3xl" /> → with custom styling
 *   <PriceDisplay amountOMR={7} as="div" />              → renders as <div> instead of <span>
 */
const PriceDisplay = memo(({ amountOMR, priceString, className = '', as: Tag = 'span', ...rest }) => {
  const { formatOMR, convertAndFormat } = useCurrency();

  let displayed;
  if (typeof amountOMR === 'number' && !isNaN(amountOMR)) {
    displayed = formatOMR(amountOMR);
  } else if (priceString) {
    displayed = convertAndFormat(priceString);
  } else {
    displayed = '';
  }

  return (
    <Tag className={className} {...rest}>
      {displayed}
    </Tag>
  );
});

PriceDisplay.displayName = 'PriceDisplay';

export default PriceDisplay;
