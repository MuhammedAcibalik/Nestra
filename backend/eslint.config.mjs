import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            '**/*.js',
            '**/*.spec.ts',
            '**/*.test.ts',
            '__tests__/**'
        ]
    },
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json'
            }
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            'no-console': 'off'
        }
    },
    {
        // Files where 'any' is necessary (ORM, mocks)
        files: [
            'src/core/repositories/base.repository.ts',
            'src/core/test/db-mock.ts'
        ],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off'
        }
    }
);
