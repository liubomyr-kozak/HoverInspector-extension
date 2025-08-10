# Логічна цепочка роботи функції "Minimize Automation"

## Огляд системи

Функція "Minimize Automation" є частиною браузерного розширення HoverInspector, що дозволяє користувачам мінімізувати інтерфейс автоматизації до компактного вигляду з швидким доступом до основних функцій.

## Архітектура системи

### 1. Компоненти системи

#### A. MinimizedLauncher.tsx
**Призначення**: Головний компонент мінімізованого інтерфейсу
**Розташування**: `/entrypoints/content/modules/MinimizedLauncher/MinimizedLauncher.tsx`

**Ключові функції**:
- Відображає компактний інтерфейс з кнопкою "Automation" 
- Показує індикатор стану (запис/активний/неактивний)
- Надає швидкий доступ до записування та відтворення сценаріїв
- Містить dropdown меню з доступними сценаріями

**Візуальні елементи**:
- MainButton: Головна кнопка з градієнтним фоном
- RecordingIndicator: Світлодіодний індикатор стану (червоний для запису, зелений для активного, сірий для неактивного)
- QuickAction: Кнопки швидких дій (запис/стоп, закриття)

#### B. useScenarioActions Hook
**Призначення**: Централізоване управління діями над сценаріями
**Розташування**: `/entrypoints/content/modules/PopupContainer/AutomationScenarios/hooks/useScenarioActions.ts`

**Основні методи**:
- `playScenario(id, startFromStep?)`: Запуск сценарію з опціональним початковим кроком
- `runSingleStep(id, stepIndex)`: Виконання одного кроку сценарію
- `editScenario(id, form?)`: Редагування сценарію
- `deleteScenario(id)`: Видалення сценарію  
- `duplicateScenario(id)`: Дублювання сценарію з інтелектуальним іменуванням

#### C. Redux Store Management
**Automation Slice** (`automation.slice.ts`):
- Управляє станом сценаріїв, функцій, розкладів та тригерів
- Зберігає стан записування, виконання та налагодження
- Містить селектори для доступу до даних

**Saga Actions** (`automation.saga.action.ts`):
- `playScenarioWatcherFn`: Комплексна логіка виконання сценарію
- `startNewRecordingFn`: Початок записування нового сценарію
- `stopRecordingWatcherFn`: Зупинка записування
- Управління локальним сховищем для збереження даних

## 2. Логічна цепочка роботи

### Фаза 1: Ініціалізація мінімізованого режиму
```
1. Користувач активує мінімізований режим
2. Dispatch: toggleFeatureMinimized(featureId)
3. MinimizedLauncher рендериться на сторінці
4. Компонент підключається до Redux store
5. Завантажуються збережені сценарії з localStorage
```

### Фаза 2: Відображення інтерфейсу
```
1. MinimizedLauncher отримує дані зі store:
   - isRecording: стан записування
   - activeScenarioId: активний сценарій
   - scenarios: список доступних сценаріїв

2. Визначення статусу індикатора:
   - "recording": якщо isRecording === true
   - "active": якщо activeScenarioId існує
   - "idle": в інших випадках

3. Генерація dropdown меню:
   - Пункт запису/зупинки
   - Список сценаріїв для швидкого запуску
   - Розділювачі між секціями
```

### Фаза 3: Взаємодія користувача

#### A. Запуск записування
```
1. Клік на іконку запису або вибір "Start Recording" в меню
2. Dispatch: startNewRecordingWatcher.getPayload()
3. Saga виконує startNewRecordingFn:
   - Встановлює recording: true
   - Очищує поточні записані кроки
   - Ініціалізує запис подій DOM
4. RecordingIndicator змінює колір на червоний з анімацією пульсу
```

#### B. Запуск сценарію
```
1. Вибір сценарію з dropdown або клік "Run [Scenario Name]"
2. Виклик playScenario(id) через useScenarioActions
3. Dispatch: playScenarioWatcher.getPayload({ id })
4. Saga виконує playScenarioWatcherFn:
   - Перевіряє існування сценарію
   - Встановлює executing: true і activeScenarioId: id
   - Запускає executeSteps для послідовного виконання
   - Обновлює прогрес виконання в реальному часі
5. RecordingIndicator змінює колір на зелений
```

#### C. Управління станом виконання
```
1. Під час виконання saga оновлює:
   - currentStepIndex: поточний крок
   - executionProgress: прогрес у відсотках
   - executionStatus: статус виконання
   - executionError: помилки (якщо є)

2. stepExecutor.saga.ts виконує кроки:
   - Ін'єкція скриптів в DOM
   - Симуляція користувацьких дій
   - Обробка помилок та retry логіки
   - Логування результатів
```

### Фаза 4: Завершення та cleanup
```
1. По завершенню сценарію:
   - executing встановлюється в false
   - activeScenarioId очищується
   - Зберігається історія виконання
   - RecordingIndicator повертається до "idle"

2. При зупинці записування:
   - recording встановлюється в false
   - recordedSteps зберігаються
   - Можливість створення нового сценарію
```

## 3. Потоки даних

### Redux State Flow
```
MinimizedLauncher ↔ Redux Store ↔ Saga Middleware ↔ LocalStorage
                    ↕
            useScenarioActions Hook
```

### Компонентна взаємодія
```
MinimizedLauncher
    ├── useSelector (отримання стану)
    ├── useDispatch (відправка дій)  
    ├── useScenarioActions (дії над сценаріями)
    └── RecordingIndicator (відображення стану)
```

## 4. Ключові особливості

### A. Управління Shadow DOM
Компонент працює в shadow DOM браузерного розширення:
```javascript
getPopupContainer={() =>
  (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)
    ?.querySelector("html > body")!
}
```

### B. Інтелектуальне позиціювання
```css
position: fixed;
right: 50%;
transform: translateX(50%);
z-index: 9999;
```

### C. Анімації та візуальні ефекти
- Градієнтний фон з hover ефектами
- Пульсуюча анімація для індикатора запису
- Плавні переходи між станами

## 5. Сценарії використання

### Базовий workflow:
1. **Мінімізація** → Користувач згортає повний інтерфейс
2. **Швидкий доступ** → Використовує компактні елементи управління
3. **Виконання** → Запускає сценарії без розгортання інтерфейсу
4. **Моніторинг** → Спостерігає за статусом через індикатор
5. **Повернення** → При потребі розгортає повний інтерфейс

### Сценарій відновлення:
При закритті мінімізованого лаунчера користувач може:
- Активувати повний інтерфейс автоматизації
- Просто закрити без активації
- Вибір зберігається в Redux store

## 6. Технічні деталі

### Залежності:
- React + Redux Toolkit
- Redux-Saga для side effects
- Ant Design для UI компонентів  
- Tabler Icons для іконок
- Styled Components для стилізації

### Типізація:
- TypeScript для type safety
- Інтерфейси для Scenario, ExecutionStatus тощо
- Typed selectors та actions

### Збереження даних:
- LocalStorage для персистентності
- Автоматичне збереження/завантаження стану
- Історія виконання сценаріїв

Ця архітектура забезпечує ефективну, масштабовану та зручну для користувача систему мінімізованої автоматизації з повним збереженням функціональності основного інтерфейсу.