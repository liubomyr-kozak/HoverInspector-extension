// Global Set of unique saga identifiers
const uniqueKeys = new Set<string>();

type SagaFunction<P = unknown> = (action: { type: string; payload: P }) => void; // Saga type

interface EnhancedSaga<P = unknown> extends SagaFunction<P> {
  actionType: string;
  getPayload: (payload?: P) => { type: string; payload?: P };
}

export const sagaEnhancer = <P = unknown>(sagaFn: SagaFunction<P>): EnhancedSaga<P> => {
  let sagaName = sagaFn.name;

  // If sagaFn has no name, generate a unique key
  if (!sagaName) {
    do {
      sagaName = Math.random().toString(36).substring(7);
    } while (uniqueKeys.has(sagaName)); // Make sure the key is unique

    // Add the new unique key to the Set
    uniqueKeys.add(sagaName);
  }

  const enhancedSaga = sagaFn as EnhancedSaga<P>;

  const actionType = sagaName.replace(/([A-Z])/g, "_$1").toUpperCase() + "__SAGA_ENHANCER";
  enhancedSaga.actionType = actionType;

  enhancedSaga.getPayload = (payload?: P) => ({
    type: actionType,
    payload,
  });

  return enhancedSaga;
};
