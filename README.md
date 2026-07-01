# J2ME Player + Xbox Controller

Сайт для запуску старих J2ME-ігор (`.jar`/`.jad`) прямо в браузері, з підтримкою Xbox-контролера.

## Що це

- Ядро емуляції — [freej2me-web](https://github.com/zb3/freej2me-web) (zb3, GPLv3): J2ME-емулятор, що виконується в браузері через CheerpJ (Java → JS міст). Файли `index.html`, `run.html`, `freej2me-web.jar`, `src/`, `libjs/`, `libmedia/`, `libmidi/`, `init.zip` — це незмінена збірка цього проєкту (ліцензія в [LICENSE-freej2me-web](LICENSE-freej2me-web)).
- Папка [controller/](controller/) — власний код: міст Gamepad API → клавіатурні події емулятора, індикатор підключення, UI для перепризначення кнопок.

## Запуск

Потрібен Node.js (для `npx serve`, який коректно віддає HTTP Range-заголовки, необхідні CheerpJ):

```bash
npx serve .
```

Відкрити `http://localhost:3000` (або порт, який покаже `serve`). Потрібне інтернет-з'єднання — CheerpJ вантажиться з `cjrtnc.leaningtech.com`.

## Як користуватись

1. На головній сторінці — "Select JAR file", завантажте `.jar` гри (і `.jad`, якщо попросить).
2. Гра з'явиться у списку "Installed Games" — клікніть, щоб запустити.
3. Підключіть/увімкніть Xbox-контролер і натисніть будь-яку кнопку — в правому верхньому куті з'явиться зелений індикатор з назвою контролера.
4. На екрані гри натисніть ⚙️ біля індикатора, щоб перепризначити кнопки (софт-клавіші, цифри, `*`/`#`). D-pad і лівий стик завжди керують рухом (стрілки) — не перепризначаються.

### Розкладка за замовчуванням

| Xbox | Дія J2ME |
|---|---|
| D-pad / лівий стик | Стрілки (рух) |
| A | Вогонь / OK |
| B | Esc (меню емулятора) |
| X / Y | Ліва / права софт-клавіша |
| LB / RB | 7 / 9 |
| LT / RT | 1 / 3 |
| View / Menu | # / * |
| L3 / R3 | 0 / 5 |

На головній сторінці (без запущеної гри) D-pad переміщує фокус між елементами, A — клікає.

## Структура

```
index.html, run.html, src/, libjs/, libmedia/, libmidi/, freej2me-web.jar, init.zip
    → незмінене ядро freej2me-web (GPLv3)
controller/
    controller-core.js        — опитування Gamepad API, edge-triggered події
    controller-play.js        — гейм-скрін: гейммпад → KeyboardEvent на #display
    controller-nav.js         — бібліотека ігор: D-pad-навігація фокусом
    controller-shared-ui.js   — індикатор підключення, модалка, тости
    controller-ui.css         — стилі
```

## Ліцензія

Код у `controller/` — без окремої ліцензії (особистий проєкт). Решта файлів — GPLv3, див. [LICENSE-freej2me-web](LICENSE-freej2me-web).
