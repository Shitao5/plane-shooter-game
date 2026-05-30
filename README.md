# 2D 飞机大战

一个基于 Vite + TypeScript + HTML5 Canvas 的本地网页小游戏。玩家驾驶飞机在纵向战场中移动、自动射击，击落随机路径敌机，并通过拾取补给获得临时武器、清屏、回血和护盾等效果。

## 运行方式

```bash
npm install
npm run dev
```

默认本地地址：

```text
http://127.0.0.1:5173/
```

生产构建：

```bash
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

## GitHub 发布前检查

- 提交前确认 `node_modules/`、`dist/` 不在仓库记录中
- 运行一次 `npm ci && npm run build`
- README 里保留清晰的运行步骤（已包含）

## 操作

- `W/A/S/D` 或方向键：上下左右移动
- `Space`：开始游戏 / 重新开始 / 从暂停恢复
- `P` 或 `Esc`：暂停 / 恢复
- 菜单中按 `1 / 2 / 3`：选择 `EASY / NORMAL / HARD`

玩家默认自动向前发射子弹，不需要按射击键。

## 玩法

- 敌机从画面上方生成并向下移动。
- 敌机路径包含直线、正弦、折返和曲线追踪等随机变化。
- 子弹击中敌机会扣血，击毁后加分并有概率掉落补给。
- 敌机撞到玩家会扣生命，玩家短暂无敌。
- 分数每达到 1000 分提升 1 级，敌机速度、血量和生成压力会逐步增加。
- 最高分保存在 `localStorage`。

## 道具

- `S` 散射：限时三向扇形弹幕。
- `R` 快速：限时高频双发。
- `L` 激光：限时高伤害穿透弹。
- `B` 清屏：拾取后立即消灭当前屏幕敌机并获得分数。
- `+` 回血：生命未满时恢复 1 点；满血时转化为分数。
- `D` 护盾：限时防护，护盾期间撞到敌机不会扣血，并会摧毁敌机。

## 项目结构

```text
.
├── index.html
├── package.json
├── public/assets/plane-shooter-sprites.png
├── src/main.ts
├── src/styles.css
├── tsconfig.json
└── vite.config.ts
```

核心游戏逻辑集中在 `src/main.ts`：

- 状态机：`MENU / PLAYING / PAUSED / GAME_OVER`
- 实体：玩家、敌机、子弹、补给、粒子
- 系统：输入、刷怪、移动、射击、碰撞、渲染、HUD

## 美术资源

当前 sprite sheet 位于：

```text
public/assets/plane-shooter-sprites.png
```

视觉概念参考位于：

```text
docs/plane-shooter-concept.png
```

如果替换 sprite sheet，需要同步检查 `src/main.ts` 中的 `SPRITE_CELL_WIDTH`、`SPRITE_CELL_HEIGHT` 和 `SPRITE_SOURCES`。
