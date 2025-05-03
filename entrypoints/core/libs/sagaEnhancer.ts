// Створюємо глобальний Set для зберігання унікальних ідентифікаторів
const uniqueKeys = new Set();

type SagaFunction<P = any> = (action: { type: string; payload: P }) => void; // Тип для саґи

interface EnhancedSaga<P = any> extends SagaFunction<P> {
  actionType: string;
  getPayload: (payload?: P) => { type: string; payload?: P };
}

export const sagaEnhancer = <P = any>(sagaFn: SagaFunction<P>): EnhancedSaga<P> => {
  let sagaName = sagaFn.name;

  // Якщо у sagaFn немає імені, генеруємо унікальний ключ
  if (!sagaName) {
    do {
      sagaName = Math.random().toString(36).substring(7);
    } while (uniqueKeys.has(sagaName)); // Перевіряємо, чи ключ унікальний

    // Додаємо новий унікальний ключ до Set
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
