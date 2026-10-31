# 俄乌战报 Leaflet 地图数据协议（v2）

地图固定地址：`https://pyotrilyichtchaikovsky.github.io/notion-map-prototypes/daily/`。

**方案1（优先）**：`#data=gz.<base64url(gzip(UTF-8(JSON.stringify(compactV2))))>`。默认压缩采用 gzip level 9；Notion URL 全长最长 1800 字符。

**方案3（仅超限或无法压缩时）**：`?snapshot=YYYY-MM-DD.json`，从 GitHub Pages 上的 `daily/snapshots/YYYY-MM-DD.json` 读取 UTF-8 明文紧凑 v2 数据。必须先上传再提交 Notion 链接，更新时不能覆盖已经归档的历史快照。

**优先级**：`#data` 存在即使用内联数据，绝不请求 snapshot；只有缺少 `#data` 才读取 `?snapshot`。内联内容错误时显示错误，不静默使用另一份可能过期的数据。旧版 AES 加密模式已移除。

## 统一紧凑数据结构

```json
{
  "v":2,
  "d":"2026-10-29",
  "p":"40823b5de1fd81b495a5f42c894c7725",
  "e":[
    ["地点","事件标题","事件摘要","证据状态","坐标说明",48.5,37.7,"32位同步事件区块ID","32位地区历史页面ID"]
  ]
}
```

`p`、事件区块 ID 和地区历史页面 ID 允许原始 UUID 带连字符，但每个必须是 32 位十六进制 Notion ID。浏览器会把当日事件链接还原成 `https://app.notion.com/p/<p>#<事件区块ID>`，地区历史链接还原成 `https://app.notion.com/p/<历史页面ID>`。坐标不可核实时经纬度都设为 `null`。所有文本和链接是公开的，只能放战报相关数据。

**打包脚本**：有 Node.js 计算环境时执行 `node daily/pack-inline.cjs < daily-map.json`，程序输出模式与 URL；如果输出 `mode:snapshot`，同时返回 GitHub 连接器要创建的 `path` 和 UTF-8 `content`。如果 Chat 定时任务没有可靠的 gzip 计算工具，应直接走方案3，绝不能让语言模型臆造 Base64URL 字节。

## 发布顺序

先创建 Notion 同步事件区块和地区历史页，fetch 获取真实 ID，准备 v2 数据，再可靠压缩并检查链接长度；方案3先写 GitHub 并读回一致性；将最终链接写入 Notion 地图 Embed 和“单独打开地图”链接；最后读回核验。不同方案无需互转，也不需要 Cloudflare。
