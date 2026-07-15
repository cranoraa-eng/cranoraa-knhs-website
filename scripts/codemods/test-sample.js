// Sample file to test the codemod with real-world usage patterns

// Pattern from MobileForm.jsx
const inputId1 = props.id || `input-${Math.random().toString(36).substring(2, 2 + 9)}`;
const selectId = props.id || `select-${Math.random().toString(36).substring(2, 2 + 9)}`;
const textareaId = props.id || `textarea-${Math.random().toString(36).substring(2, 2 + 9)}`;

// Additional test patterns
const str = "Hello World";
const result1 = str.substring(6, 6 + 5);  // Should become substring(6, 6 + 5)
const result2 = str.slice(-5);     // Should become slice(-5)
const result3 = str.slice(-5, -5 + 3);  // Should become slice(-5, -5 + 3)
const result4 = str.substring(0);      // Should become substring(0)

export { inputId1, selectId, textareaId, result1, result2, result3, result4 };
