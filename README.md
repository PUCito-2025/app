# PUCito
Proyecto construido con Next.js, TypeScript y Clerk para autenticación, incluyendo un pipeline de CI/CD con GitHub Actions y despliegue en Vercel.

## Installation
1. Clona el repositorio:
2. Instala las dependencias:
   ```bash
   npm i
   ```
3. Configura las variables de entorno definidas en `.env.example`:
4. Lanza el servidor de desarrollo:
   ```bash
   npm run dev
   ```

Para los builds de producción, estos pueden ser vistos desde Vercel.

## Examples
- **Health-check API**: Visita [`/api/health`](http://localhost:3000/api/health) para verificar que el backend responde con `{ status: "ok" }`.
- **Páginas protegidas**: Cualquier página que use Clerk requiere autenticación;

## Notification System

This app includes a scheduled notification system that sends emails for:
- 📅 **Weekly Summary** (Mondays 8am Chilean time)
- 📚 **Daily Study Plan** (Tue-Sun 8am Chilean time)  
- ⏱️ **Tracking Reminder** (Daily 2pm Chilean time)

### Testing Notifications

You can test the notification system using several methods:

**Using NPM scripts (recommended):**
```bash
npm run test:notifications           # Show help
npm run test:notifications:check    # Check server status
npm run test:notifications:seed     # Create test data
npm run test:notifications:weekly   # Test weekly email
npm run test:notifications:daily    # Test daily email
npm run test:notifications:tracking # Test tracking email
npm run test:notifications:all      # Run all tests
```

**Using Make commands:**
```bash
make help      # Show available commands
make check     # Check server status
make weekly    # Test weekly notification
make all       # Run all tests
```

**Using shell script directly:**
```bash
./test-notifications.sh help
./test-notifications.sh weekly
```

📧 Test emails are sent to: `citopuc@gmail.com`

For detailed testing instructions, see [`NOTIFICATION_TESTING.md`](./NOTIFICATION_TESTING.md).

## Troubleshooting
- **Error de importación `@/...`**: Asegúrate de tener el alias configurado en `tsconfig.json` y en `vite.config.ts` (o `vitest.config.ts`).
- **Vitest sin tests**: Crea un archivo `tests/example.test.ts` con un test simple (por ejemplo, `1 + 1 = 2`) para asegurarte de que funciona.
- **Husky o lint-staged no bloquea commits**: Revisa tu `.husky/pre-commit` y la configuración en `package.json`; usa `eslint --cache --fix` con `--max-warnings 0`.

## Changelog
El historial de cambios se encuentra en la lista de [releases de GitHub](https://github.com/PUCito-2025/app/releases).

## Additional Resources
- [Clerk](https://clerk.com)
- [Vercel](https://vercel.com)

## License Information
Este proyecto está licenciado bajo la licencia MIT.
```
MIT License

Copyright (c) 2025 PUCito

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
