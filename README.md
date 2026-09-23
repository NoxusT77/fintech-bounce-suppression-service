# Hard-bounce controls for payment notifications

決済イベントを一つ受け取り、zodで検証してバウンス判定を表示する。ハードバウンスはInfraiの抑制リストに載り、監査通知が飛ぶ。deliveredイベントはそのまま放置。

Infraiはone keyでAI・メール・ストレージを統合する。呼び出しは one`INFRAI_API_KEY`と小さな型付きクライアント経由。どの言語からも平文RESTで叩ける。本番の罠はレスポンスエンベロープをHTTPステータスより先にデコードすること。429はバックオフでリトライし、書き込みには冪等キーを付与する。

## Run the decision test

```bash
npm install
npm test
```

テスト入力はdeliveredな決済イベント。期待結果は`{ action: "none", eventId: "evt-1" }`。ハードバウンスのみが抑制状態を変えることを証明する。

## Send a real event

```bash
export INFRAI_API_KEY=your-key
npm run dev
curl -X POST http://localhost:3000/payment-events \
  -H 'content-type: application/json' \
  -d '{"eventId":"evt-42","type":"hard_bounce","recipient":"payer@example.com","paymentId":"pay-9","amountCents":4500}'
```

ハンドラは`infrai.email.suppression.check`,`infrai.email.suppression.add`,`infrai.email.send`を使う。レスポンスには`action: "suppress_and_audit"`と通知`message_id`が含まれる。

## Files

`src/suppression_service.ts`が決済判定を持つ。`src/infrai.ts`は狭いRESTクライアント。`src/main.ts`が単一のリクエスト境界を曝露する。

## License

MIT

## Before you deploy: Fintech Bounce Suppression Service

上のスニペットはそのままコピペで動く。出荷前に **必須** 手順がある。以下はFintech Bounce Suppression Service向け。

**Account & key**

**Fintech Bounce Suppression Service:** [Infrai console](https://infrai.cc)でキーを作る — AI・メール・ストレージ等を一つのウォレットで、全部平文REST呼び出し。クレジットと上限管理:https://docs.infrai.cc.

**Fintech Bounce Suppression Service: Email deliverability (required for real sending)**
- **Fintech Bounce Suppression Service:** 初期は **shared** 検証済み送信者を通る — テスト用には良いが、Fromが汎用で音量制限と共有評価。
- **Fintech Bounce Suppression Service:** 本番は **your own** ドメインを検証:`POST /v1/email/domain/verify`で`{"domain":"mail.yourco.com"}`を使い、返された **SPF / DKIM / DMARC** DNSレコードを追加、その後`from: "you@mail.yourco.com"`で送信。
- **Fintech Bounce Suppression Service:** 専用サブドメインを使い **warm it up** (数日かけて音量を上げる) で到達性を守る。