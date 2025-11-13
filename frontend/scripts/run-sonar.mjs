import { existsSync } from 'node:fs';
import scanner from 'sonarqube-scanner';

const fallbackToken = 'sqp_d6e3d72626a2b9df970a635977c53debbe134e61';
const token = process.env.SONAR_FRONTEND_TOKEN?.trim() || fallbackToken;
if (!process.env.SONAR_FRONTEND_TOKEN) {
    console.warn('SONAR_FRONTEND_TOKEN 미설정: 기본 토큰을 사용합니다.');
}

const coveragePath = 'coverage/lcov.info';
if (!existsSync(coveragePath)) {
    console.warn(`경고: ${coveragePath} 파일이 없습니다. "npm run test:coverage"를 먼저 실행하세요.`);
}

scanner(
    {
        serverUrl: process.env.SONAR_HOST_URL ?? 'http://localhost:9000',
        token,
        options: {
            'sonar.projectKey': 'kanban-frontend',
            'sonar.projectName': 'kanban-frontend',
            'sonar.sourceEncoding': 'UTF-8',
            'sonar.sources': 'src',
            'sonar.tests': 'src',
            'sonar.test.inclusions': 'src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,src/**/*.spec.tsx',
            'sonar.exclusions': 'src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,src/**/*.spec.tsx',
            'sonar.javascript.lcov.reportPaths': coveragePath,
            'sonar.typescript.tsconfigPath': 'tsconfig.json'
        }
    },
    (result) => {
        if (result?.errors && result.errors.length > 0) {
            console.error('SonarQube 분석 중 오류가 발생했습니다:', result.errors);
            process.exit(1);
        }
        console.log('SonarQube 분석이 완료되었습니다.');
        process.exit();
    }
);
