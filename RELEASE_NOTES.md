基于 [CarsonGame/EchoMusic-TaskbarLyrics](https://github.com/CarsonGame/EchoMusic-TaskbarLyrics) 继续开发，由 fengjianhua7 维护，保留 MIT 许可证及原版权声明。

- 将歌词画面嵌入 Windows 任务栏子窗口，修复透明 WPF 子窗口不显示的问题。
- 在歌词区域使用滚轮调节 EchoMusic 音量，每格 5%，显示短暂音量条。
- 修复切歌、播放/暂停与收藏按钮的点击转发，保留歌词和空白区域的鼠标穿透。
- 支持多屏 DPI 定位与透明绘制。

插件源：https://github.com/fengjianhua7/EchoMusic-TaskbarLyrics

也可下载附件，停用旧插件，将完整 `taskbar-lyrics` 文件夹替换到 EchoMusic 插件目录后重新启用。需 Windows x64、.NET Framework WPF 和 EchoMusic 2.3.2-beta.9 或更新版本。

保留原插件 ID `taskbar-lyrics`，用于替换原版；请勿同时启用两个版本。

验证：45 项 JavaScript 测试通过；原生 x64 程序编译通过。任务栏显示、96/144 DPI 绘制和模拟播放器按钮/滚轮路径已进行本地测试；原生鼠标测试需要交互式桌面，不在 GitHub Actions 中执行。
