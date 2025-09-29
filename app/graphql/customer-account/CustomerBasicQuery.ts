export const CUSTOMER_QUERY = `#graphql
  query CustomerBasic {
    customer {
      id
      emailAddress {
        emailAddress
      }
      firstName
      lastName
    }
  }
`;
