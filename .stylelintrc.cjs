module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-tailwindcss',
    'stylelint-config-prettier',
  ],
  rules: {
    // Permitir diretivas do Tailwind
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen', 'layer'],
      },
    ],
    // Aceitar classes em kebab-case, BEM (__, --), underscore simples e escapes do Tailwind
    'selector-class-pattern': null, // Desabilitar para permitir classes do Tailwind com escapes complexos
    // Ignorar propriedades utilitárias do Tailwind usadas em CSS gerado
    'property-no-unknown': [
      true,
      {
        ignoreProperties: [
          'ring-color',
          'ring-offset-shadow',
          'ring-shadow',
          '--tw-ring-color',
          '--tw-ring-offset-shadow',
          '--tw-ring-shadow',
        ],
      },
    ],
    // Permitir pseudo-elementos da View Transition API (experimental, mas válida)
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: [
          'view-transition-old',
          'view-transition-new',
          'view-transition-group',
        ],
      },
    ],
  },
};


