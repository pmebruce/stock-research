# 持股／觀察名單研究台

GitHub Pages: https://pmebruce.github.io/stock-research/

真實日K優先讀取 `data/quotes.json`；資料超過四天或不在排程名單時，嘗試瀏覽器公開來源。更新失敗時保留並標示歷史資料；完全無資料時停止分析，不產生模擬價格。頁面可手動更新，前景每15分鐘刷新。

GitHub Actions 每個工作日台灣時間15:30、次日06:30（UTC 07:30、22:30）執行；排程可能延後。新標的需加入 `data/symbols.json` 才有排程快照，本機觀察清單不會自動傳到GitHub。可在 Actions 手動執行。

持股與筆記儲存在此瀏覽器，行情為研究輔助。RSI目前使用最近14筆漲跌的簡單平均，不是Wilder平滑法。
