# Form Components

Enhanced form components with validation, multi-step support, and accessibility.

## Components

### ValidatedInput
Input component with real-time validation and error display.

### MultiStepForm
Wizard-style multi-step form with progress indicator.

### FieldGroup
Fieldset wrapper for grouping related form fields.

## Usage

```jsx
import { ValidatedInput, MultiStepForm } from '@/components/forms';

function RegistrationForm() {
  const [email, setEmail] = useState('');
  
  const rules = [
    { type: 'required', message: 'Email is required' },
    { type: 'email', message: 'Invalid email format' }
  ];

  return (
    <ValidatedInput
      name="email"
      label="Email Address"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      rules={rules}
      showValidation="onBlur"
      helpText="We'll never share your email"
    />
  );
}
```

## Multi-Step Example

```jsx
function OnboardingForm() {
  const steps = [
    { id: 'personal', title: 'Personal Info', content: <PersonalInfoForm /> },
    { id: 'account', title: 'Account Setup', content: <AccountForm /> },
    { id: 'preferences', title: 'Preferences', content: <PreferencesForm /> }
  ];

  return (
    <MultiStepForm
      steps={steps}
      showProgress
      onComplete={handleComplete}
    />
  );
}
```

## Requirements
- React 18.2+
- Tailwind CSS 3.3+

## Validation Rules
- `required` - Field must have a value
- `email` - Valid email format
- `minLength` - Minimum character length
- `maxLength` - Maximum character length
- `pattern` - Regex pattern match
- `custom` - Custom validator function
