import {CartReturn} from '@shopify/hydrogen';
import {useEffect} from 'react';

type Customer = {
  id?: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

type BqScriptProps = {
  bonifiqId: string;
  nonce?: string;
  cart?: Promise<CartReturn | null> | undefined;
  customer?: Promise<Customer | null>;
};

export function BqScript({
  bonifiqId,
  nonce,
  cart,
  customer,
}: BqScriptProps) {
  useEffect(() => {
    if (!bonifiqId) return;

    const src = `https://bq-scripts.s3.amazonaws.com/scripts/${bonifiqId}/bqloader.js`;
    let script: HTMLScriptElement | null = null;
    let cancelled = false;

    (async () => {
      const resolvedCustomer = customer ? await customer : null;

      // Prefer explicit props; fall back to cart.buyerIdentity
let email: string | null | undefined =
  (resolvedCustomer as any)?.email ??
  (resolvedCustomer as any)?.emailAddress?.emailAddress ??
  null;      let id: string | undefined = resolvedCustomer?.id
        ? resolvedCustomer.id.split('/').pop()
        : undefined;
      const customerFullName =
        resolvedCustomer?.firstName || resolvedCustomer?.lastName
          ? `${resolvedCustomer.firstName ?? ''} ${
              resolvedCustomer.lastName ?? ''
            }`.trim()
          : undefined;
      let name: string | null | undefined = customerFullName;

      if ((!email || !id || !name) && cart) {
        try {
          const resolved = await cart; // <-- resolve the Promise<CartReturn | null>
          const bi: any = resolved?.buyerIdentity as any | undefined;

          // In Hydrogen, buyerIdentity has `email` and optional `customer`
          if (bi) {
            email = email ?? bi.email ?? bi.customer?.email ?? null;
            const c = bi.customer as
              | {
                  id?: string;
                  firstName?: string | null;
                  lastName?: string | null;
                }
              | undefined;

            if (c) {
              id = id ?? (c.id ? c.id.split('/').pop() : undefined);
              const firstName = c.firstName ?? null;
              const lastName = c.lastName ?? null;
              const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
              if (fullName) {
                name = name ?? fullName;
              }
            }
          }
        } catch (ex) {
          console.log('[BonifiQ] Error on customer resolution - ' + ex)
        }
      }

      if (cancelled) return;
      
if (!name && email) {
  name = email;
}
if (email) sessionStorage.setItem('bqemail', String(email));
if (id) sessionStorage.setItem('bqid', String(id));
if (name) sessionStorage.setItem('bqname', name);

      script = document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      script.async = true;
      if (nonce) script.nonce = nonce;
      document.head.appendChild(script);
    })();

    return () => {
      cancelled = true;
      if (script && document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
    // Re-run if inputs change
  }, [bonifiqId, nonce, cart, customer]);

  return null;
}
