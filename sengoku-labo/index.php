<?php
$page_title = 'SengokuLabo | AIデジタルサービス開発・導入支援';
$page_desc  = 'AIを活用したデジタルサービスの企画・開発・導入支援。えほんごとのたねをBtoBで自社事業に取り入れたい方のお問い合わせはこちら。';
require 'header.php';
?>

<!-- Hero -->
<section class="hero">
  <div class="container">
    <h1>あなたのビジネスに、<br>デジタルの力を。</h1>
    <p>AIを活用したサービス開発・導入支援を行っています。<br>えほんごとのたねをはじめ、BtoBでの導入・連携を承ります。</p>
    <div class="hero_btns">
      <a href="contact.php" class="btn btn_primary">お問い合わせ</a>
      <a href="#services" class="btn btn_outline">サービスを見る</a>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services">
  <div class="container">
    <div class="sec_head">
      <h2>提供サービス</h2>
      <span class="accent_line"></span>
      <p>現在提供中のサービスと、今後リリース予定のサービスです。</p>
    </div>
    <div class="card_grid">

      <div class="card">
        <span class="service_tag">提供中</span>
        <h3>えほんごとのたね</h3>
        <p>回答をもとにAIが自動で絵本を生成するサービス。PDFダウンロード・製本に対応。BtoBでの導入・カスタマイズも可能です。</p>
        <a href="#btob" class="btn btn_outline">BtoBプランを見る</a>
      </div>

      <div class="card coming_soon">
        <span class="service_tag">準備中</span>
        <h3>その他のサービス <span class="badge_soon">Coming Soon</span></h3>
        <p>新サービスを順次リリース予定です。詳細はお問い合わせください。</p>
      </div>

    </div>
  </div>
</section>

<!-- BtoB Plan -->
<section id="btob" class="btob">
  <div class="container">
    <div class="sec_head">
      <h2>えほんごとのたね BtoBプラン</h2>
      <span class="accent_line"></span>
      <p>えほんごとのたねをあなたの事業のフロントサービスとして活用できます。</p>
    </div>
    <div class="plan_grid">
      <div class="plan_card">
        <h3>スタンダード</h3>
        <ul>
          <li>えほんごとのたね基本機能</li>
          <li>専用テーマ設定</li>
          <li>PDFダウンロード・製本対応</li>
          <li>月次レポート</li>
        </ul>
        <p class="plan_price">料金：お問い合わせ</p>
      </div>
      <div class="plan_card">
        <h3>カスタム</h3>
        <ul>
          <li>スタンダードの全機能</li>
          <li>質問・テーマのカスタマイズ</li>
          <li>専用URLの発行</li>
          <li>導入サポート付き</li>
        </ul>
        <p class="plan_price">料金：お問い合わせ</p>
      </div>
      <div class="plan_card">
        <h3>エンタープライズ</h3>
        <ul>
          <li>カスタムの全機能</li>
          <li>独自ドメイン対応</li>
          <li>専任サポート</li>
          <li>SLA保証</li>
        </ul>
        <p class="plan_price">料金：お問い合わせ</p>
      </div>
    </div>
    <a href="contact.php" class="btn btn_primary">導入について相談する</a>
  </div>
</section>

<!-- Contact CTA -->
<section>
  <div class="container">
    <div class="card card_cta">
      <h2>まずはお気軽にご相談ください</h2>
      <p>導入のご検討・ご質問・お見積もりなど、お気軽にお問い合わせください。</p>
      <a href="contact.php" class="btn btn_primary">お問い合わせフォームへ</a>
    </div>
  </div>
</section>

<?php require 'footer.php'; ?>
