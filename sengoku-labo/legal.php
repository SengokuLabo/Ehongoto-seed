<?php
$page_title = '特定商取引法・プライバシーポリシー | SengokuLabo';
require 'header.php';
?>

<section class="page_hero">
  <div class="container">
    <h1>特定商取引法・ポリシー</h1>
  </div>
</section>

<section>
  <div class="container_narrow">

    <!-- 特定商取引法 -->
    <div class="legal_section">
      <h2>特定商取引法に基づく表記</h2>
      <table class="legal_table">
        <tr><th>事業者名</th><td><?= COMPANY ?>（<?= OWNER ?>）</td></tr>
        <tr><th>所在地</th><td><?= ADDRESS ?></td></tr>
        <tr><th>電話番号</th><td>お問い合わせフォームにてお受けしております。<br>（開示請求があった場合は遅滞なく開示いたします）</td></tr>
        <tr><th>メールアドレス</th><td><?= EMAIL ?></td></tr>
        <tr><th>販売価格</th><td>各サービスページに記載の価格（税込）</td></tr>
        <tr><th>支払方法</th><td>クレジットカード（Stripe決済）</td></tr>
        <tr><th>支払時期</th><td>ご注文時にお支払いいただきます</td></tr>
        <tr><th>サービス提供時期</th><td>PDFダウンロード：決済完了後、即時ダウンロード可能<br>製本：ご注文確認後、順次発送（目安：2〜3週間）</td></tr>
        <tr><th>返品・キャンセル</th><td>デジタルコンテンツ（PDF）の性質上、購入後の返金・キャンセルは原則お受けできません。<br>製本は製造開始後のキャンセルはお受けできません。<br>不具合・瑕疵がある場合はご連絡ください。</td></tr>
        <tr><th>動作環境</th><td>最新版のChrome・Safari・Firefox・Edge（スマートフォン含む）</td></tr>
      </table>
    </div>

    <!-- プライバシーポリシー -->
    <div id="privacy" class="legal_section">
      <h2>プライバシーポリシー</h2>

      <h3>収集する情報</h3>
      <ul>
        <li>氏名・メールアドレス・住所・電話番号（購入時・問い合わせ時）</li>
        <li>決済情報（Stripeが管理します。当社はカード番号を保持しません）</li>
        <li>アクセスログ（IPアドレス・ブラウザ情報等）</li>
      </ul>

      <h3>利用目的</h3>
      <ul>
        <li>サービスの提供・配送・メール送信</li>
        <li>お問い合わせへの対応</li>
        <li>サービス改善・障害対応</li>
      </ul>

      <h3>第三者提供</h3>
      <p>法令に基づく場合を除き、ご本人の同意なく第三者に提供しません。</p>

      <h3>利用する外部サービス</h3>
      <ul>
        <li>Stripe（決済処理）</li>
        <li>Amazon Web Services（サーバー・メール送信）</li>
        <li>Anthropic（AI文章生成）</li>
      </ul>

      <h3>お問い合わせ</h3>
      <p>個人情報の開示・訂正・削除のご依頼は <a href="contact.php" class="link_accent">お問い合わせフォーム</a> よりご連絡ください。</p>
    </div>

    <!-- 返金・キャンセルポリシー -->
    <div class="legal_section">
      <h2>返金・キャンセルポリシー</h2>
      <h3>デジタルコンテンツ（PDF）</h3>
      <p>デジタルコンテンツの性質上、購入完了後の返金・キャンセルは原則お受けできません。</p>
      <h3>製本サービス</h3>
      <p>製造開始前のキャンセルはご相談ください。製造開始後はキャンセルをお受けできません。</p>
      <h3>不具合・瑕疵がある場合</h3>
      <p>当社の瑕疵に起因する不具合が発生した場合は、<a href="contact.php" class="link_accent">お問い合わせフォーム</a> よりご連絡ください。誠実に対応いたします。</p>
    </div>

    <p class="text_muted_sm">最終更新：<?= YEAR ?>年<?= date('n') ?>月<?= date('j') ?>日</p>
  </div>
</section>

<?php require 'footer.php'; ?>
